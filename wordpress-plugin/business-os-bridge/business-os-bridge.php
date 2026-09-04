<?php
/**
 * Plugin Name: Business OS Elementor Bridge
 * Description: A capability-checked REST bridge for Business OS to inspect and edit Elementor page data.
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Business OS
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Business_OS_Elementor_Bridge {
	const VERSION = '1.0.0';
	const NAMESPACE = 'business-os/v1';
	const MAX_JSON_BYTES = 2000000;
	const MAX_DEPTH = 30;

	public static function boot() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	public static function register_routes() {
		register_rest_route(
			self::NAMESPACE,
			'/health',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'health' ),
				'permission_callback' => array( __CLASS__, 'can_use_bridge' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/elementor/pages/(?P<id>\d+)/structure',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_structure' ),
				'permission_callback' => array( __CLASS__, 'can_edit_page' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/elementor/pages',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'create_page' ),
				'permission_callback' => array( __CLASS__, 'can_create_page' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/elementor/pages/(?P<id>\d+)/apply',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'apply_change' ),
				'permission_callback' => array( __CLASS__, 'can_edit_page' ),
			)
		);
	}

	public static function can_use_bridge() {
		return current_user_can( 'edit_pages' ) || current_user_can( 'edit_posts' );
	}

	public static function can_create_page() {
		return current_user_can( 'edit_pages' );
	}

	public static function can_edit_page( WP_REST_Request $request ) {
		$post = get_post( (int) $request['id'] );
		return $post && 'page' === $post->post_type && current_user_can( 'edit_post', $post->ID );
	}

	public static function health() {
		return rest_ensure_response(
			array(
				'ok'                 => true,
				'bridge'             => 'business-os-elementor-bridge',
				'version'            => self::VERSION,
				'elementor_active'   => defined( 'ELEMENTOR_VERSION' ),
				'authenticated_user' => get_current_user_id(),
				'capabilities'       => array(
					'edit_pages'   => current_user_can( 'edit_pages' ),
					'publish_pages'=> current_user_can( 'publish_pages' ),
					'upload_files' => current_user_can( 'upload_files' ),
				),
			)
		);
	}

	public static function get_structure( WP_REST_Request $request ) {
		$post_id = (int) $request['id'];
		$post    = get_post( $post_id );
		$elements = self::read_elements( $post_id );

		if ( is_wp_error( $elements ) ) {
			return $elements;
		}

		return rest_ensure_response(
			array(
				'id'               => $post_id,
				'title'            => get_the_title( $post_id ),
				'status'           => $post->post_status,
				'link'             => get_permalink( $post_id ),
				'modified'         => $post->post_modified_gmt,
				'elementor_active' => defined( 'ELEMENTOR_VERSION' ),
				'elementor_version'=> defined( 'ELEMENTOR_VERSION' ) ? ELEMENTOR_VERSION : null,
				'elements'         => $elements,
			)
		);
	}

	public static function create_page( WP_REST_Request $request ) {
		$params   = $request->get_json_params();
		$title    = isset( $params['title'] ) ? sanitize_text_field( $params['title'] ) : '';
		$status   = isset( $params['status'] ) ? sanitize_key( $params['status'] ) : 'draft';
		$elements = isset( $params['elements'] ) ? self::validate_elements( $params['elements'] ) : array();

		if ( '' === $title ) {
			return new WP_Error( 'business_os_missing_title', 'A page title is required.', array( 'status' => 400 ) );
		}
		if ( ! in_array( $status, array( 'draft', 'pending', 'private' ), true ) ) {
			return new WP_Error( 'business_os_invalid_status', 'New bridge pages must start as draft, pending, or private.', array( 'status' => 400 ) );
		}
		if ( is_wp_error( $elements ) ) {
			return $elements;
		}

		$post_id = wp_insert_post(
			array(
				'post_title'  => $title,
				'post_content'=> isset( $params['content'] ) ? wp_kses_post( $params['content'] ) : '',
				'post_status' => $status,
				'post_type'   => 'page',
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		$write = self::write_elements( $post_id, $elements );
		if ( is_wp_error( $write ) ) {
			wp_delete_post( $post_id, true );
			return $write;
		}

		return new WP_REST_Response( self::page_summary( $post_id, $elements ), 201 );
	}

	public static function apply_change( WP_REST_Request $request ) {
		$post_id = (int) $request['id'];
		$params  = $request->get_json_params();
		$action  = isset( $params['action'] ) ? sanitize_key( $params['action'] ) : '';
		$before  = self::read_elements( $post_id );

		if ( is_wp_error( $before ) ) {
			return $before;
		}

		$after = $before;
		$changed = array();
		switch ( $action ) {
			case 'replace_text':
				$search  = isset( $params['search'] ) ? (string) $params['search'] : '';
				$replace = isset( $params['replace'] ) ? (string) $params['replace'] : '';
				$expected = isset( $params['expected_count'] ) ? (int) $params['expected_count'] : null;
				if ( '' === $search ) {
					return new WP_Error( 'business_os_missing_search', 'replace_text requires a non-empty search string.', array( 'status' => 400 ) );
				}
				$match_count = 0;
				$after = self::replace_settings_text_recursive( $after, $search, $replace, $match_count );
				if ( null !== $expected && $expected !== $match_count ) {
					return new WP_Error( 'business_os_unexpected_match_count', sprintf( 'Expected %d text matches but found %d. Nothing was saved.', $expected, $match_count ), array( 'status' => 409 ) );
				}
				if ( 0 === $match_count ) {
					return new WP_Error( 'business_os_text_not_found', 'The requested text was not found. Nothing was saved.', array( 'status' => 404 ) );
				}
				$changed = array( 'matches' => $match_count );
				break;

			case 'update_settings':
				$element_id = isset( $params['element_id'] ) ? sanitize_key( $params['element_id'] ) : '';
				$settings   = isset( $params['settings'] ) && is_array( $params['settings'] ) ? $params['settings'] : null;
				if ( '' === $element_id || null === $settings ) {
					return new WP_Error( 'business_os_invalid_settings', 'update_settings requires element_id and settings.', array( 'status' => 400 ) );
				}
				$found = false;
				$after = self::update_settings_recursive( $after, $element_id, $settings, $found );
				if ( ! $found ) {
					return new WP_Error( 'business_os_element_not_found', 'The Elementor element was not found. Nothing was saved.', array( 'status' => 404 ) );
				}
				$changed = array( 'element_id' => $element_id, 'updated_keys' => array_keys( $settings ) );
				break;

			case 'insert_element':
				$element = isset( $params['element'] ) ? self::validate_element( $params['element'] ) : new WP_Error( 'business_os_missing_element', 'insert_element requires an element.' );
				if ( is_wp_error( $element ) ) {
					return $element;
				}
				$parent_id = isset( $params['parent_id'] ) ? sanitize_key( $params['parent_id'] ) : '';
				$inserted = false;
				$after = self::insert_recursive( $after, $parent_id, $element, $inserted );
				if ( '' !== $parent_id && ! $inserted ) {
					return new WP_Error( 'business_os_parent_not_found', 'The requested parent element was not found.', array( 'status' => 404 ) );
				}
				$changed = array( 'element_id' => $element['id'], 'parent_id' => $parent_id ?: null );
				break;

			case 'remove_element':
				$element_id = isset( $params['element_id'] ) ? sanitize_key( $params['element_id'] ) : '';
				$removed = false;
				$after = self::remove_recursive( $after, $element_id, $removed );
				if ( '' === $element_id || ! $removed ) {
					return new WP_Error( 'business_os_element_not_found', 'The Elementor element was not found. Nothing was saved.', array( 'status' => 404 ) );
				}
				$changed = array( 'element_id' => $element_id );
				break;

			case 'replace_document':
				if ( empty( $params['elements'] ) || ! is_array( $params['elements'] ) ) {
					return new WP_Error( 'business_os_missing_elements', 'replace_document requires a complete elements array.', array( 'status' => 400 ) );
				}
				$after = self::validate_elements( $params['elements'] );
				if ( is_wp_error( $after ) ) {
					return $after;
				}
				$changed = array( 'root_elements' => count( $after ) );
				break;

			default:
				return new WP_Error( 'business_os_unknown_action', 'Allowed actions: replace_text, update_settings, insert_element, remove_element, replace_document.', array( 'status' => 400 ) );
		}

		$write = self::write_elements( $post_id, $after );
		if ( is_wp_error( $write ) ) {
			return $write;
		}

		return rest_ensure_response(
			array(
				'ok'      => true,
				'action'  => $action,
				'changed' => $changed,
				'page'    => self::page_summary( $post_id, $after ),
			)
		);
	}

	private static function read_elements( $post_id ) {
		$raw = get_post_meta( $post_id, '_elementor_data', true );
		if ( '' === $raw || null === $raw ) {
			return array();
		}
		if ( strlen( (string) $raw ) > self::MAX_JSON_BYTES ) {
			return new WP_Error( 'business_os_payload_too_large', 'The Elementor document exceeds the bridge safety limit.', array( 'status' => 413 ) );
		}
		$elements = json_decode( wp_unslash( $raw ), true );
		if ( ! is_array( $elements ) ) {
			return new WP_Error( 'business_os_invalid_elementor_data', 'The Elementor document is not valid JSON.', array( 'status' => 502 ) );
		}
		return self::validate_elements( $elements );
	}

	private static function write_elements( $post_id, $elements ) {
		$json = wp_json_encode( $elements );
		if ( false === $json || strlen( $json ) > self::MAX_JSON_BYTES ) {
			return new WP_Error( 'business_os_payload_too_large', 'The Elementor document exceeds the bridge safety limit.', array( 'status' => 413 ) );
		}
		update_post_meta( $post_id, '_elementor_data', wp_slash( $json ) );
		update_post_meta( $post_id, '_elementor_edit_mode', 'builder' );
		if ( defined( 'ELEMENTOR_VERSION' ) ) {
			update_post_meta( $post_id, '_elementor_version', ELEMENTOR_VERSION );
		}
		if ( class_exists( '\Elementor\Plugin' ) ) {
			$plugin = \Elementor\Plugin::instance();
			if ( isset( $plugin->files_manager ) && method_exists( $plugin->files_manager, 'clear_cache' ) ) {
				$plugin->files_manager->clear_cache();
			}
		}
		return true;
	}

	private static function page_summary( $post_id, $elements ) {
		$post = get_post( $post_id );
		return array(
			'id'        => $post_id,
			'title'     => get_the_title( $post_id ),
			'status'    => $post ? $post->post_status : '',
			'link'      => get_permalink( $post_id ),
			'edit_url'  => admin_url( 'post.php?post=' . $post_id . '&action=elementor' ),
			'elements'  => $elements,
			'modified'  => $post ? $post->post_modified_gmt : '',
		);
	}

	private static function validate_elements( $elements, $depth = 0 ) {
		if ( ! is_array( $elements ) || $depth > self::MAX_DEPTH ) {
			return new WP_Error( 'business_os_invalid_elements', 'Elementor elements must be a bounded nested array.', array( 'status' => 400 ) );
		}
		$out = array();
		foreach ( $elements as $element ) {
			$valid = self::validate_element( $element, $depth );
			if ( is_wp_error( $valid ) ) {
				return $valid;
			}
			$out[] = $valid;
		}
		return $out;
	}

	private static function validate_element( $element, $depth = 0 ) {
		if ( ! is_array( $element ) || empty( $element['id'] ) || ! isset( $element['elType'] ) || ! in_array( $element['elType'], array( 'widget', 'column', 'section', 'container' ), true ) ) {
			return new WP_Error( 'business_os_invalid_element', 'Each Elementor element needs an id and a supported elType.', array( 'status' => 400 ) );
		}
		$id = sanitize_key( (string) $element['id'] );
		if ( '' === $id ) {
			return new WP_Error( 'business_os_invalid_element_id', 'Element ids may only contain letters, numbers, underscores, and hyphens.', array( 'status' => 400 ) );
		}
		$out = array(
			'id'       => $id,
			'elType'   => sanitize_key( (string) $element['elType'] ),
			'settings' => isset( $element['settings'] ) && is_array( $element['settings'] ) ? $element['settings'] : array(),
		);
		if ( isset( $element['elements'] ) ) {
			$out['elements'] = self::validate_elements( $element['elements'], $depth + 1 );
			if ( is_wp_error( $out['elements'] ) ) {
				return $out['elements'];
			}
		}
		return $out;
	}

	private static function replace_settings_text_recursive( $elements, $search, $replace, &$count ) {
		foreach ( $elements as $index => $element ) {
			if ( isset( $element['settings'] ) ) {
				$elements[ $index ]['settings'] = self::replace_text_recursive( $element['settings'], $search, $replace, $count );
			}
			if ( ! empty( $element['elements'] ) ) {
				$elements[ $index ]['elements'] = self::replace_settings_text_recursive( $element['elements'], $search, $replace, $count );
			}
		}
		return $elements;
	}

	private static function replace_text_recursive( $value, $search, $replace, &$count ) {
		if ( is_string( $value ) ) {
			$count += substr_count( $value, $search );
			return str_replace( $search, $replace, $value );
		}
		if ( is_array( $value ) ) {
			foreach ( $value as $key => $item ) {
				$value[ $key ] = self::replace_text_recursive( $item, $search, $replace, $count );
			}
		}
		return $value;
	}

	private static function update_settings_recursive( $elements, $element_id, $settings, &$found ) {
		foreach ( $elements as $index => $element ) {
			if ( isset( $element['id'] ) && $element['id'] === $element_id ) {
				$elements[ $index ]['settings'] = array_merge( $element['settings'] ?? array(), $settings );
				$found = true;
				return $elements;
			}
			if ( ! empty( $element['elements'] ) ) {
				$elements[ $index ]['elements'] = self::update_settings_recursive( $element['elements'], $element_id, $settings, $found );
				if ( $found ) {
					return $elements;
				}
			}
		}
		return $elements;
	}

	private static function insert_recursive( $elements, $parent_id, $new_element, &$inserted ) {
		if ( '' === $parent_id ) {
			$elements[] = $new_element;
			$inserted = true;
			return $elements;
		}
		foreach ( $elements as $index => $element ) {
			if ( isset( $element['id'] ) && $element['id'] === $parent_id ) {
				if ( ! isset( $elements[ $index ]['elements'] ) ) {
					$elements[ $index ]['elements'] = array();
				}
				$elements[ $index ]['elements'][] = $new_element;
				$inserted = true;
				return $elements;
			}
			if ( ! empty( $element['elements'] ) ) {
				$elements[ $index ]['elements'] = self::insert_recursive( $element['elements'], $parent_id, $new_element, $inserted );
				if ( $inserted ) {
					return $elements;
				}
			}
		}
		return $elements;
	}

	private static function remove_recursive( $elements, $element_id, &$removed ) {
		foreach ( $elements as $index => $element ) {
			if ( isset( $element['id'] ) && $element['id'] === $element_id ) {
				array_splice( $elements, $index, 1 );
				$removed = true;
				return $elements;
			}
			if ( ! empty( $element['elements'] ) ) {
				$elements[ $index ]['elements'] = self::remove_recursive( $element['elements'], $element_id, $removed );
				if ( $removed ) {
					return $elements;
				}
			}
		}
		return $elements;
	}
}

Business_OS_Elementor_Bridge::boot();
