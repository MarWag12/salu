<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | SMS Service Configuration
    |--------------------------------------------------------------------------
    |
    | Configure your SMS provider here. Common providers for Angola include
    | Infobip, Twilio, or local providers.
    |
    */
    'sms' => [
        'enabled' => env('SMS_ENABLED', false),
        'url' => env('SMS_API_URL', ''),
        'key' => env('SMS_API_KEY', ''),
        'sender_id' => env('SMS_SENDER_ID', 'SALU'),
    ],

    /*
    |--------------------------------------------------------------------------
    | WhatsApp Business API Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the Meta WhatsApp Business API for sending notifications.
    |
    */
    'whatsapp' => [
        'enabled' => env('WHATSAPP_ENABLED', false),
        'url' => env('WHATSAPP_API_URL', 'https://graph.facebook.com/v18.0'),
        'token' => env('WHATSAPP_API_TOKEN', ''),
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | AWS Rekognition Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for AWS Rekognition service used for KYC verification.
    |
    */
    'aws_rekognition' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
        'version' => 'latest',
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Verification Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for automatic KYC verification using AI.
    |
    */
    'ai_verification' => [
        'enabled' => env('AI_VERIFICATION_ENABLED', false),
        'face_match_threshold' => env('AI_FACE_MATCH_THRESHOLD', 80.0),
        'liveness_threshold' => env('AI_LIVENESS_THRESHOLD', 75.0),
        'auto_approve' => env('AI_AUTO_APPROVE', false),
    ],

];
