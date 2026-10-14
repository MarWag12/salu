<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Service;
use App\Services\MessageService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MessageController extends Controller
{
    public function __construct(
        protected MessageService $messageService
    ) {}

    /**
     * Display inbox with all conversations.
     */
    public function index()
    {
        $user = auth()->user();

        $conversations = $this->messageService->getConversationsForUser($user);

        return Inertia::render('Messages/Index', [
            'conversations' => $conversations,
            'unreadCount' => $this->messageService->getUnreadCountForUser($user),
        ]);
    }

    /**
     * Display a conversation.
     */
    public function show(Conversation $conversation)
    {
        $user = auth()->user();

        $this->authorize('view', $conversation);

        $messages = $this->messageService->getMessagesForConversation($conversation, $user);

        $conversation->load(['client', 'provider', 'service']);

        return Inertia::render('Messages/Show', [
            'conversation' => $conversation,
            'messages' => $messages,
            'otherParticipant' => $conversation->getOtherParticipant($user),
        ]);
    }

    /**
     * Start a conversation with a service provider.
     */
    public function startFromService(Request $request, Service $service)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $user = auth()->user();

        // Get or create conversation
        $conversation = $this->messageService->getConversationForService($user, $service);

        // Send initial message
        $this->messageService->sendMessage($conversation, $user, $request->message);

        return redirect()->route('messages.show', $conversation)
            ->with('success', 'Mensagem enviada com sucesso!');
    }

    /**
     * Send a message in a conversation.
     */
    public function store(Request $request, Conversation $conversation)
    {
        $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $this->authorize('view', $conversation);

        $user = auth()->user();

        $this->messageService->sendMessage($conversation, $user, $request->content);

        return back()->with('success', 'Mensagem enviada!');
    }

    /**
     * Mark conversation as read.
     */
    public function markAsRead(Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        $this->messageService->markConversationAsRead($conversation, auth()->user());

        return response()->json(['success' => true]);
    }

    /**
     * Get unread count.
     */
    public function unreadCount()
    {
        $count = $this->messageService->getUnreadCountForUser(auth()->user());

        return response()->json(['count' => $count]);
    }
}
