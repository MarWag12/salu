<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use App\Models\Concerns\HasUniqueSlug;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use Audited, HasUniqueSlug;

    protected static function auditLabel(): string
    {
        return 'categoria';
    }

    /** Ícones disponíveis (nomes Tabler) — o mesmo conjunto existe em resources/js/components/Icon.tsx. */
    public const ICONS = [
        'ti-bolt' => 'Electricidade', 'ti-droplet' => 'Água / canalização', 'ti-paint' => 'Pintura', 'ti-hammer' => 'Martelo / carpintaria',
        'ti-snowflake' => 'Ar condicionado', 'ti-lock' => 'Fechaduras', 'ti-sparkles' => 'Limpeza', 'ti-tools' => 'Ferramentas',
        'ti-home' => 'Casa', 'ti-bulb' => 'Iluminação', 'ti-plug' => 'Tomadas', 'ti-flame' => 'Gás / fogão',
        'ti-brush' => 'Pincel', 'ti-ruler' => 'Medidas', 'ti-bug' => 'Pragas', 'ti-leaf' => 'Jardim',
        'ti-truck' => 'Mudanças', 'ti-wifi' => 'Redes / Wi-Fi', 'ti-device-tv' => 'Electrónica', 'ti-wall' => 'Alvenaria',
        'ti-wind' => 'Ventilação', 'ti-door' => 'Portas', 'ti-bath' => 'Casa de banho', 'ti-sofa' => 'Mobiliário',
    ];

    protected $fillable = ['name', 'slug', 'icon', 'description', 'active'];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function technicians(): BelongsToMany
    {
        return $this->belongsToMany(Technician::class);
    }

    public function scopeActive($q)
    {
        return $q->where('active', true);
    }
}
