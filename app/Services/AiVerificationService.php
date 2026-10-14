<?php

namespace App\Services;

use App\Models\KycVerification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AiVerificationService
{
    /**
     * Verify face match between ID document and selfie.
     *
     * Uses AWS Rekognition CompareFaces API.
     */
    public function verifyFaceMatch(string $idDocumentPath, string $selfiePath): array
    {
        try {
            // Check if AI verification is enabled
            if (!config('services.ai_verification.enabled', false)) {
                return [
                    'match_score' => null,
                    'is_match' => null,
                    'error' => 'AI verification is disabled',
                ];
            }

            // Read image files
            $sourceImage = is_file($idDocumentPath) ? file_get_contents($idDocumentPath) : null;
            $targetImage = is_file($selfiePath) ? file_get_contents($selfiePath) : null;

            if (!$sourceImage || !$targetImage) {
                throw new \Exception('Unable to read image files');
            }

            // AWS Rekognition client
            if (!class_exists(\Aws\Rekognition\RekognitionClient::class)) {
                throw new \Exception('SDK da AWS não instalado (composer require aws/aws-sdk-php).');
            }

            $client = new \Aws\Rekognition\RekognitionClient([
                'region' => config('services.aws_rekognition.region', 'us-east-1'),
                'version' => config('services.aws_rekognition.version', 'latest'),
                'credentials' => [
                    'key' => config('services.aws_rekognition.key'),
                    'secret' => config('services.aws_rekognition.secret'),
                ],
            ]);

            // Compare faces
            $result = $client->compareFaces([
                'SimilarityThreshold' => config('services.ai_verification.face_match_threshold', 80.0),
                'SourceImage' => [
                    'Bytes' => $sourceImage,
                ],
                'TargetImage' => [
                    'Bytes' => $targetImage,
                ],
            ]);

            // Extract similarity score
            $faceMatches = $result['FaceMatches'] ?? [];

            if (empty($faceMatches)) {
                return [
                    'match_score' => 0,
                    'is_match' => false,
                    'confidence' => 100,
                    'details' => 'No matching faces found',
                ];
            }

            $similarity = $faceMatches[0]['Similarity'] ?? 0;
            $threshold = config('services.ai_verification.face_match_threshold', 80.0);

            return [
                'match_score' => round($similarity, 2),
                'is_match' => $similarity >= $threshold,
                'confidence' => round($faceMatches[0]['Face']['Confidence'] ?? 0, 2),
                'details' => $result->toArray(),
            ];
        } catch (\Aws\Exception\AwsException $e) {
            Log::error('AWS Rekognition CompareFaces failed', [
                'error' => $e->getMessage(),
                'code' => $e->getAwsErrorCode(),
            ]);

            return [
                'match_score' => null,
                'is_match' => null,
                'error' => 'AWS Rekognition error: ' . $e->getAwsErrorMessage(),
            ];
        } catch (\Exception $e) {
            Log::error('Face match verification failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'match_score' => null,
                'is_match' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Detect if selfie is a real photo (liveness detection).
     *
     * Uses AWS Rekognition DetectFaces to check quality indicators.
     */
    public function detectLiveness(string $selfiePath): array
    {
        try {
            // Check if AI verification is enabled
            if (!config('services.ai_verification.enabled', false)) {
                return [
                    'liveness_score' => null,
                    'is_live' => null,
                    'error' => 'AI verification is disabled',
                ];
            }

            // Read image file
            $image = is_file($selfiePath) ? file_get_contents($selfiePath) : null;

            if (!$image) {
                throw new \Exception('Unable to read selfie file');
            }

            // AWS Rekognition client
            if (!class_exists(\Aws\Rekognition\RekognitionClient::class)) {
                throw new \Exception('SDK da AWS não instalado (composer require aws/aws-sdk-php).');
            }

            $client = new \Aws\Rekognition\RekognitionClient([
                'region' => config('services.aws_rekognition.region', 'us-east-1'),
                'version' => config('services.aws_rekognition.version', 'latest'),
                'credentials' => [
                    'key' => config('services.aws_rekognition.key'),
                    'secret' => config('services.aws_rekognition.secret'),
                ],
            ]);

            // Detect faces with quality attributes
            $result = $client->detectFaces([
                'Image' => [
                    'Bytes' => $image,
                ],
                'Attributes' => ['ALL'],
            ]);

            $faceDetails = $result['FaceDetails'] ?? [];

            if (empty($faceDetails)) {
                return [
                    'liveness_score' => 0,
                    'is_live' => false,
                    'details' => 'No face detected',
                ];
            }

            $face = $faceDetails[0];

            // Calculate liveness score based on quality indicators
            // Higher scores for: eyes open, good brightness, sharp focus
            $eyesOpen = ($face['EyesOpen']['Value'] ?? false) ? 25 : 0;
            $mouthClosed = ($face['MouthOpen']['Value'] ?? true) ? 0 : 15; // Prefer closed mouth
            $brightness = min(($face['Quality']['Brightness'] ?? 0), 100) * 0.3;
            $sharpness = min(($face['Quality']['Sharpness'] ?? 0), 100) * 0.3;

            $livenessScore = $eyesOpen + $mouthClosed + $brightness + $sharpness;
            $threshold = config('services.ai_verification.liveness_threshold', 75.0);

            return [
                'liveness_score' => round($livenessScore, 2),
                'is_live' => $livenessScore >= $threshold,
                'confidence' => round($face['Confidence'] ?? 0, 2),
                'quality' => [
                    'brightness' => round($face['Quality']['Brightness'] ?? 0, 2),
                    'sharpness' => round($face['Quality']['Sharpness'] ?? 0, 2),
                ],
                'attributes' => [
                    'eyes_open' => $face['EyesOpen']['Value'] ?? null,
                    'mouth_open' => $face['MouthOpen']['Value'] ?? null,
                ],
                'details' => $result->toArray(),
            ];
        } catch (\Aws\Exception\AwsException $e) {
            Log::error('AWS Rekognition DetectFaces failed', [
                'error' => $e->getMessage(),
                'code' => $e->getAwsErrorCode(),
            ]);

            return [
                'liveness_score' => null,
                'is_live' => null,
                'error' => 'AWS Rekognition error: ' . $e->getAwsErrorMessage(),
            ];
        } catch (\Exception $e) {
            Log::error('Liveness detection failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'liveness_score' => null,
                'is_live' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Process full KYC verification with AI.
     */
    public function processKycVerification(KycVerification $verification): void
    {
        try {
            Log::info('Starting AI verification for KYC', [
                'kyc_id' => $verification->id,
            ]);

            // Caminhos absolutos dos ficheiros guardados pela biblioteca de media
            $idMedia = $verification->documents()
                ->where('type', 'identity_document')->first()?->getFirstMedia('document');
            $selfieMedia = $verification->documents()
                ->where('type', 'selfie')->first()?->getFirstMedia('document');

            if ($idMedia && $idMedia->mime_type === 'application/pdf') {
                throw new \Exception('O documento em PDF requer revisão manual (a IA só analisa JPG/PNG).');
            }

            $idDocumentPath = $idMedia?->getPath();
            $selfiePath = $selfieMedia?->getPath();

            if (!$idDocumentPath || !$selfiePath) {
                throw new \Exception('Missing required documents');
            }

            // Step 1: Verify face match
            $faceMatchResult = $this->verifyFaceMatch($idDocumentPath, $selfiePath);

            // Step 2: Detect liveness
            $livenessResult = $this->detectLiveness($selfiePath);

            // Determine overall status
            $status = 'pending';

            if (isset($faceMatchResult['error']) || isset($livenessResult['error'])) {
                $status = 'error';
            } elseif (
                $faceMatchResult['is_match'] === true &&
                $livenessResult['is_live'] === true
            ) {
                $status = 'passed';
            } elseif (
                $faceMatchResult['is_match'] === false ||
                $livenessResult['is_live'] === false
            ) {
                $status = 'failed';
            }

            // Update verification record
            $verification->update([
                'ai_face_match_score' => $faceMatchResult['match_score'],
                'ai_liveness_score' => $livenessResult['liveness_score'],
                'ai_verification_status' => $status,
                'ai_verification_response' => [
                    'face_match' => $faceMatchResult,
                    'liveness' => $livenessResult,
                    'processed_at' => now()->toIso8601String(),
                ],
                'ai_verified_at' => now(),
            ]);

            // Auto-approve if configured and AI passed
            if (
                config('services.ai_verification.auto_approve', false) &&
                $status === 'passed'
            ) {
                $verification->update([
                    'status' => 'approved',
                    'reviewed_at' => now(),
                    'admin_notes' => 'Auto-approved by AI verification',
                ]);
            }

            Log::info('AI verification completed', [
                'kyc_id' => $verification->id,
                'status' => $status,
                'face_match_score' => $faceMatchResult['match_score'],
                'liveness_score' => $livenessResult['liveness_score'],
            ]);
        } catch (\Exception $e) {
            Log::error('KYC AI verification failed', [
                'kyc_id' => $verification->id,
                'error' => $e->getMessage(),
            ]);

            $verification->update([
                'ai_verification_status' => 'error',
                'ai_verification_response' => [
                    'error' => $e->getMessage(),
                    'processed_at' => now()->toIso8601String(),
                ],
                'ai_verified_at' => now(),
            ]);
        }
    }
}
