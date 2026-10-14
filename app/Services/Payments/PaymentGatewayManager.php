<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use InvalidArgumentException;

class PaymentGatewayManager
{
    protected array $gateways = [];

    public function __construct()
    {
        $this->registerDefaultGateways();
    }

    /**
     * Register default payment gateways.
     */
    protected function registerDefaultGateways(): void
    {
        $this->register('simulated', fn () => new SimulatedPaymentGateway());
        $this->register('simulation', fn () => new SimulatedPaymentGateway());
        $this->register('stripe', fn () => new StripePaymentGateway());
    }

    /**
     * Register a payment gateway.
     */
    public function register(string $name, callable $resolver): void
    {
        $this->gateways[$name] = $resolver;
    }

    /**
     * Get a payment gateway instance.
     */
    public function gateway(?string $name = null): PaymentGateway
    {
        $name = $name ?? $this->getDefaultGateway();

        if (!isset($this->gateways[$name])) {
            throw new InvalidArgumentException("Payment gateway [{$name}] is not registered.");
        }

        return call_user_func($this->gateways[$name]);
    }

    /**
     * Get the default gateway name.
     */
    public function getDefaultGateway(): string
    {
        return config('services.payments.default', 'simulated');
    }

    /**
     * Get all registered gateway names.
     */
    public function getAvailableGateways(): array
    {
        return array_keys($this->gateways);
    }
}
