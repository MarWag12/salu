<?php

namespace App\Http\Controllers;

use App\Models\Technician;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function kyc(Request $request, Technician $technician)
    {
        $user = $request->user();
        abort_unless($user->isAdmin() || $technician->user_id === $user->id, 403);

        $media = $technician->getFirstMedia('kyc_document');
        abort_unless($media, 404, 'Documento não encontrado.');

        return response()->file($media->getPath(), [
            'Content-Type' => $media->mime_type,
            'Content-Disposition' => 'inline; filename="'.$media->file_name.'"',
        ]);
    }
}
