<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// Canal privado de cada utilizador (estado dos seus pedidos).
Broadcast::channel('users.{id}', fn (User $user, int $id) => $user->id === $id && $user->active);

// Canal privado de todos os técnicos activos (novos pedidos disponíveis).
Broadcast::channel('technicians', fn (User $user) => $user->isTecnico() && $user->active);
