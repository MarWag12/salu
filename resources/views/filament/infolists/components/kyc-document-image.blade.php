@php
    $url = $getState();
@endphp

<div class="fi-in-text">
    @if($url)
        <div class="space-y-3">
            <a href="{{ $url }}" target="_blank" class="block">
                <img
                    src="{{ $url }}"
                    alt="Documento KYC"
                    class="rounded-lg shadow-lg max-h-80 w-auto object-contain border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity cursor-pointer"
                    onerror="this.parentElement.innerHTML='<div class=\'p-4 bg-red-50 text-red-600 rounded-lg\'>Erro ao carregar imagem</div>'"
                />
            </a>
            <a
                href="{{ $url }}"
                target="_blank"
                class="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-500 transition-colors"
            >
                <x-heroicon-o-arrow-top-right-on-square class="w-4 h-4" />
                Ver Tamanho Original
            </a>
        </div>
    @else
        <div class="p-4 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-lg">
            Nenhuma imagem disponivel
        </div>
    @endif
</div>
