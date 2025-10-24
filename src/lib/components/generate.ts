export const generateContent = async ({
    type = 'post',
    onUpdate
}: {
    type: 'post' | 'comment';
    onUpdate?: (content: string) => void;
}) => {
    try {
        const response = await fetch("/api/posts/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ type }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            throw new Error(
                errorData.error ||
                `HTTP ${response.status}: Failed to generate content`
            );
        }

        // Handle streaming response
        if (onUpdate && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let content = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    content += chunk;
                    onUpdate(content);
                }

                return { content };
            } finally {
                reader.releaseLock();
            }
        } else {
            // Fallback for non-streaming (shouldn't happen with new API)
            const text = await response.text();
            return { content: text };
        }
    } catch (error) {
        console.error("Error generating content:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Failed to generate content";
        throw new Error(errorMessage);
    }
};