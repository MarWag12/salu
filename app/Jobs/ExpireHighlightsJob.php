<?php

namespace App\Jobs;

use App\Services\ServiceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ExpireHighlightsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        //
    }

    public function handle(ServiceService $serviceService): void
    {
        $expiredCount = $serviceService->expireHighlights();

        if ($expiredCount > 0) {
            Log::info("Expired {$expiredCount} service highlights.");
        }
    }
}
