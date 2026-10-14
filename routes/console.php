<?php

use App\Jobs\ExpireHighlightsJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule highlight expiration job daily
Schedule::job(new ExpireHighlightsJob())->daily();
