<?php

/**
 * Laravel - A PHP Framework For Web Artisans
 *
 * This file redirects all requests to the public folder.
 * For production, configure your web server to point directly to the public directory.
 */

// Redirect to public folder
header('Location: public/');
exit;
