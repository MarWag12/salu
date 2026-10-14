<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderTaskController extends Controller
{
    /**
     * Get all tasks for an order.
     */
    public function index(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Authorization: only client or provider can see tasks
        if ($order->client_id !== $user->id &&
            $order->provider->user_id !== $user->id) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        $tasks = $order->tasks()
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($task) => [
                'id' => $task->id,
                'task_type' => $task->task_type,
                'description' => $task->description,
                'location' => $task->location,
                'duration_minutes' => $task->duration_minutes,
                'formatted_duration' => $task->getFormattedDuration(),
                'value_charged' => $task->value_charged,
                'formatted_value' => $task->getFormattedValue(),
                'status' => $task->status,
                'completed_at' => $task->completed_at?->toIso8601String(),
                'created_at' => $task->created_at->toIso8601String(),
            ]);

        // Calculate summary
        $summary = [
            'total_tasks' => $tasks->count(),
            'completed_tasks' => $tasks->where('status', 'completed')->count(),
            'in_progress_tasks' => $tasks->where('status', 'in_progress')->count(),
            'pending_tasks' => $tasks->where('status', 'pending')->count(),
            'total_duration' => (float) ($tasks->sum('duration_minutes')),
            'total_value' => (float) ($tasks->sum('value_charged')),
        ];

        return response()->json([
            'tasks' => $tasks,
            'summary' => $summary,
        ]);
    }

    /**
     * Create a new task.
     */
    public function store(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Authorization: only provider can create tasks
        if ($order->provider->user_id !== $user->id) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        $validated = $request->validate([
            'task_type' => 'nullable|string|max:255',
            'description' => 'required|string|max:2000',
            'location' => 'nullable|string|max:255',
            'duration_minutes' => 'nullable|integer|min:0',
            'value_charged' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,in_progress,completed',
        ]);

        $task = $order->tasks()->create([
            'task_type' => $validated['task_type'] ?? null,
            'description' => $validated['description'],
            'location' => $validated['location'] ?? null,
            'duration_minutes' => $validated['duration_minutes'] ?? null,
            'value_charged' => $validated['value_charged'] ?? null,
            'status' => $validated['status'] ?? 'pending',
            'completed_at' => ($validated['status'] ?? 'pending') === 'completed' ? now() : null,
        ]);

        return response()->json([
            'success' => true,
            'task' => [
                'id' => $task->id,
                'task_type' => $task->task_type,
                'description' => $task->description,
                'location' => $task->location,
                'duration_minutes' => $task->duration_minutes,
                'formatted_duration' => $task->getFormattedDuration(),
                'value_charged' => $task->value_charged,
                'formatted_value' => $task->getFormattedValue(),
                'status' => $task->status,
                'completed_at' => $task->completed_at?->toIso8601String(),
                'created_at' => $task->created_at->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Update a task.
     */
    public function update(Request $request, Order $order, OrderTask $task): JsonResponse
    {
        $user = $request->user();

        // Authorization: only provider can update tasks
        if ($order->provider->user_id !== $user->id) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        // Verify task belongs to order
        if ($task->order_id !== $order->id) {
            return response()->json(['error' => 'Tarefa não encontrada'], 404);
        }

        $validated = $request->validate([
            'task_type' => 'nullable|string|max:255',
            'description' => 'sometimes|required|string|max:2000',
            'location' => 'nullable|string|max:255',
            'duration_minutes' => 'nullable|integer|min:0',
            'value_charged' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,in_progress,completed',
        ]);

        // If status is being changed to completed, set completed_at
        if (isset($validated['status']) && $validated['status'] === 'completed' && !$task->isCompleted()) {
            $validated['completed_at'] = now();
        }

        $task->update($validated);

        return response()->json([
            'success' => true,
            'task' => [
                'id' => $task->id,
                'task_type' => $task->task_type,
                'description' => $task->description,
                'location' => $task->location,
                'duration_minutes' => $task->duration_minutes,
                'formatted_duration' => $task->getFormattedDuration(),
                'value_charged' => $task->value_charged,
                'formatted_value' => $task->getFormattedValue(),
                'status' => $task->status,
                'completed_at' => $task->completed_at?->toIso8601String(),
                'created_at' => $task->created_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Delete a task.
     */
    public function destroy(Request $request, Order $order, OrderTask $task): JsonResponse
    {
        $user = $request->user();

        // Authorization: only provider can delete tasks
        if ($order->provider->user_id !== $user->id) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        // Verify task belongs to order
        if ($task->order_id !== $order->id) {
            return response()->json(['error' => 'Tarefa não encontrada'], 404);
        }

        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tarefa removida com sucesso',
        ]);
    }

    /**
     * Toggle task status (mark as complete/incomplete).
     */
    public function toggleStatus(Request $request, Order $order, OrderTask $task): JsonResponse
    {
        $user = $request->user();

        // Authorization: only provider can toggle status
        if ($order->provider->user_id !== $user->id) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        // Verify task belongs to order
        if ($task->order_id !== $order->id) {
            return response()->json(['error' => 'Tarefa não encontrada'], 404);
        }

        if ($task->isCompleted()) {
            $task->update([
                'status' => 'pending',
                'completed_at' => null,
            ]);
        } else {
            $task->markCompleted();
        }

        return response()->json([
            'success' => true,
            'task' => [
                'id' => $task->id,
                'status' => $task->status,
                'completed_at' => $task->completed_at?->toIso8601String(),
            ],
        ]);
    }
}
