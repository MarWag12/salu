<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayoutMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'provider_id',
        'type',
        'name',
        'bank_name',
        'account_number',
        'account_holder',
        'iban',
        'phone_number',
        'provider_name',
        'is_default',
        'is_verified',
        'verified_at',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_verified' => 'boolean',
        'verified_at' => 'datetime',
    ];

    const TYPE_BANK_TRANSFER = 'bank_transfer';
    const TYPE_MOBILE_MONEY = 'mobile_money';
    const TYPE_EXPRESS = 'express';

    public function provider(): BelongsTo
    {
        return $this->belongsTo(ServiceProvider::class, 'provider_id');
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class);
    }

    public static function getTypes(): array
    {
        return [
            self::TYPE_BANK_TRANSFER => 'Transferência Bancária',
            self::TYPE_MOBILE_MONEY => 'Mobile Money',
            self::TYPE_EXPRESS => 'Express/Multicaixa',
        ];
    }

    public static function getBanks(): array
    {
        return [
            'BAI' => 'Banco Angolano de Investimentos (BAI)',
            'BFA' => 'Banco de Fomento Angola (BFA)',
            'BIC' => 'Banco BIC',
            'BPC' => 'Banco de Poupança e Crédito (BPC)',
            'BMA' => 'Banco Millennium Atlântico (BMA)',
            'BCGA' => 'Banco Caixa Geral Angola (BCGA)',
            'BSol' => 'Banco Sol',
            'KEVE' => 'Banco Keve',
            'BNI' => 'Banco de Negócios Internacional (BNI)',
            'SBA' => 'Standard Bank Angola',
            'BCI' => 'Banco de Comércio e Indústria (BCI)',
            'Finibanco' => 'Finibanco Angola',
            'VTB' => 'VTB Africa',
            'YETU' => 'Banco Yetu',
        ];
    }

    public static function getMobileMoneyProviders(): array
    {
        return [
            'unitel_money' => 'Unitel Money',
            'africell_money' => 'Africell Money',
            'e_kwanza' => 'e-Kwanza',
        ];
    }

    public function isBankTransfer(): bool
    {
        return $this->type === self::TYPE_BANK_TRANSFER;
    }

    public function isMobileMoney(): bool
    {
        return $this->type === self::TYPE_MOBILE_MONEY;
    }

    public function isExpress(): bool
    {
        return $this->type === self::TYPE_EXPRESS;
    }

    public function getDisplayNameAttribute(): string
    {
        if ($this->isBankTransfer()) {
            return "{$this->bank_name} - ****" . substr($this->account_number, -4);
        }

        if ($this->isMobileMoney()) {
            return "{$this->provider_name} - ****" . substr($this->phone_number, -4);
        }

        return $this->name;
    }
}
