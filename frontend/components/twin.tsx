'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    ArrowUp,
    Bot,
    BriefcaseBusiness,
    Code2,
    MessageCircleMore,
    RotateCcw,
    SendHorizontal,
    Sparkles,
    UserRound,
} from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(
    /\/$/,
    '',
);

const starterPrompts = [
    {
        label: 'What does Athar build?',
        icon: Code2,
    },
    {
        label: 'Tell me about the shipped iOS apps',
        icon: Sparkles,
    },
    {
        label: 'How does Athar approach a new SaaS project?',
        icon: BriefcaseBusiness,
    },
];

function formatTime(timestamp: Date) {
    return new Intl.DateTimeFormat('en', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(timestamp);
}

function generateId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 11);
}


export default function Twin() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const streamedResponseRef = useRef('');

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, isLoading]);

    const resetConversation = () => {
        setMessages([]);
        setSessionId('');
        setInput('');
        inputRef.current?.focus();
    };

    const sendMessage = async (messageToSend = input) => {
        const message = messageToSend.trim();
        if (!message || isLoading) return;

        const userMessage: Message = {
            id: generateId(),
            role: 'user',
            content: message,
            timestamp: new Date(),
        };

        setMessages((previous) => [...previous, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    session_id: sessionId || undefined,
                }),
            });

            if (!response.ok) {
                throw new Error('The twin service could not respond.');
            }

            const newSessionId = response.headers.get('X-Session-ID');
            if (newSessionId) {
                setSessionId(newSessionId);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No reader available');
            }

            const decoder = new TextDecoder();
            streamedResponseRef.current = '';
            const assistantMessageId = generateId();

            setMessages((previous) => [
                ...previous,
                {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: '',
                    timestamp: new Date(),
                },
            ]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                streamedResponseRef.current += chunk;

                setMessages((previous) =>
                    previous.map((msg) =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: streamedResponseRef.current }
                            : msg
                    )
                );
            }

            const remaining = decoder.decode();
            if (remaining) {
                streamedResponseRef.current += remaining;
                setMessages((previous) =>
                    previous.map((msg) =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: streamedResponseRef.current }
                            : msg
                    )
                );
            }

            if (!streamedResponseRef.current.trim()) {
                throw new Error('The twin service returned an empty response.');
            }
        } catch {
            setMessages((previous) => [
                ...previous,
                {
                    id: generateId(),
                    role: 'assistant',
                    content:
                        'I could not connect to the twin service. Please try again in a moment.',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void sendMessage();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void sendMessage();
        }
    };

    return (
        <section className="twin-shell" aria-label="Athar's digital twin">
            <header className="twin-header">
                <div className="twin-identity">
                    <div className="twin-mark" aria-hidden="true">
                        <span>A</span>
                    </div>
                    <div>
                        <p className="eyebrow">ATHAR / DIGITAL TWIN</p>
                        <h1>Ask about the work behind the work.</h1>
                    </div>
                </div>

                <div className="twin-actions">
                    <span className="availability">
                        <span className="status-dot" />
                        Available to talk
                    </span>
                    <button
                        className="icon-button"
                        type="button"
                        onClick={resetConversation}
                        aria-label="Start a new conversation"
                        title="Start a new conversation"
                    >
                        <RotateCcw size={17} strokeWidth={1.8} />
                    </button>
                </div>
            </header>

            <div className="twin-context">
                <span>Solo product engineer</span>
                <i />
                <span>Mobile, SaaS, AI systems</span>
                <i />
                <span>Pakistan / working globally</span>
            </div>

            <div className="conversation-frame">
                <div className="conversation-meta">
                    <span className="conversation-label">
                        <MessageCircleMore size={16} strokeWidth={1.8} />
                        Conversation
                    </span>
                    <span className="conversation-state">
                        {isLoading ? 'Thinking' : sessionId ? 'Memory on' : 'Ready'}
                    </span>
                </div>

                <div className="messages" aria-live="polite">
                    {messages.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon" aria-hidden="true">
                                <Bot size={22} strokeWidth={1.7} />
                            </div>
                            <p className="empty-kicker">A product-minded conversation</p>
                            <h2>What are you building?</h2>
                            <p>
                                I can speak to Athar&apos;s shipped iOS apps, SaaS platforms,
                                AI product work, and how he scopes an engagement.
                            </p>
                            <div className="prompt-grid">
                                {starterPrompts.map(({ label, icon: Icon }) => (
                                    <button
                                        key={label}
                                        className="prompt-button"
                                        type="button"
                                        onClick={() => void sendMessage(label)}
                                        disabled={isLoading}
                                    >
                                        <Icon size={16} strokeWidth={1.8} />
                                        <span>{label}</span>
                                        <ArrowUp size={14} strokeWidth={1.8} aria-hidden="true" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="message-list">
                            {messages.map((message) => (
                                <article
                                    className={`message-row ${message.role}`}
                                    key={message.id}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="message-avatar assistant-avatar" aria-hidden="true">
                                            <Bot size={16} strokeWidth={1.8} />
                                        </div>
                                    )}
                                    <div className="message-content">
                                        <p className="message-author">
                                            {message.role === 'assistant' ? 'Athar' : 'You'}
                                        </p>
                                        <div className="message-bubble">
                                            <ReactMarkdown>{message.content}</ReactMarkdown>
                                        </div>
                                        <time dateTime={message.timestamp.toISOString()}>
                                            {formatTime(message.timestamp)}
                                        </time>
                                    </div>
                                    {message.role === 'user' && (
                                        <div className="message-avatar user-avatar" aria-hidden="true">
                                            <UserRound size={16} strokeWidth={1.8} />
                                        </div>
                                    )}
                                </article>
                            ))}
                            {isLoading && !messages.some(
                                (message) => message.role === 'assistant' && message.content,
                            ) && (
                                    <div className="message-row assistant">
                                        <div className="message-avatar assistant-avatar" aria-hidden="true">
                                            <Bot size={16} strokeWidth={1.8} />
                                        </div>
                                        <div className="typing-indicator" aria-label="Athar is thinking">
                                            <span />
                                            <span />
                                            <span />
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="composer" onSubmit={handleSubmit}>
                    <label className="sr-only" htmlFor="twin-message">
                        Your message
                    </label>
                    <textarea
                        ref={inputRef}
                        id="twin-message"
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about a product, platform, or working style..."
                        maxLength={4000}
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        className="send-button"
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        aria-label="Send message"
                        title="Send message"
                    >
                        <SendHorizontal size={18} strokeWidth={2} />
                    </button>
                </form>
                <p className="composer-note">Enter to send · Shift + Enter for a new line</p>
            </div>
        </section>
    );
}
