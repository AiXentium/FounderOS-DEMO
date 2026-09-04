# Business OS Elementor Bridge

This plugin gives Business OS a small, authenticated REST API for the part WordPress normally keeps inside Elementor: the page's nested `_elementor_data` document.

## Install

1. Zip the `business-os-bridge` folder, or upload it from **Plugins → Add New → Upload Plugin**.
2. Activate it on the WordPress site.
3. Use a WordPress user with `edit_pages` and `edit_post` capability for the pages Business OS must edit. Add `publish_pages` only if that user should publish.
4. Keep `WORDPRESS_URL`, `WORDPRESS_USERNAME`, and `WORDPRESS_APP_PASSWORD` configured in Business OS. WordPress Application Passwords are used for REST authentication; do not put those credentials in browser code.

## Endpoints

- `GET /wp-json/business-os/v1/health`
- `GET /wp-json/business-os/v1/elementor/pages/{id}/structure`
- `POST /wp-json/business-os/v1/elementor/pages`
- `POST /wp-json/business-os/v1/elementor/pages/{id}/apply`

Supported draft-edit actions are `replace_text`, `update_settings`, `insert_element`, `remove_element`, and `replace_document`. Every request is capability checked, bounded for payload size/depth, and writes only Elementor metadata. Publishing remains a separate, explicit WordPress operation.

The bridge deliberately does not remove `X-Frame-Options` or weaken CSP. The Business OS workspace can inspect and modify the document through REST while Elementor remains in its normal WordPress editor when visual editing is needed.
