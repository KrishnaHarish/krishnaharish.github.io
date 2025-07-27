/**
 * WhatsApp Chat Parser
 * 
 * This script helps parse WhatsApp chat exports into a structured format
 * that can be used to generate organized HTML content
 */

// Sample function to parse WhatsApp chat exports
function parseWhatsAppChat(chatText) {
    const lines = chatText.split('\n');
    const messages = [];
    let currentMessage = null;
    
    for (const line of lines) {
        // Match the date/time pattern at the beginning of messages
        const dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{1,2}), (\d{1,2}:\d{1,2} [ap]m) - ([^:]+): (.*)/i);
        
        if (dateMatch) {
            // If we find a new message pattern, save the previous message if it exists
            if (currentMessage) {
                messages.push(currentMessage);
            }
            
            // Create a new message object
            currentMessage = {
                date: dateMatch[1],
                time: dateMatch[2],
                sender: dateMatch[3].trim(),
                content: dateMatch[4],
                year: '20' + dateMatch[1].split('/')[2], // Extract year
                month: dateMatch[1].split('/')[1],
                day: dateMatch[1].split('/')[0],
                category: categorizeMessage(dateMatch[4])
            };
        } else if (currentMessage) {
            // If no date pattern, this is a continuation of the previous message
            currentMessage.content += '\n' + line;
        }
    }
    
    // Add the last message
    if (currentMessage) {
        messages.push(currentMessage);
    }
    
    return messages;
}

// Helper function to categorize messages based on content
function categorizeMessage(content) {
    const categories = [];
    
    if (content.includes('<Media omitted>')) {
        categories.push('media');
    }
    
    if (content.match(/http:\/\/www\.profraguram\.com|https:\/\/www\.profraguram\.com/)) {
        categories.push('blog-posts');
    }
    
    if (content.match(/temple|sculpture|art|architecture|heritage|monument|Hampi|Angkor/i)) {
        categories.push('art-culture');
    }
    
    if (content.match(/photo|photograph|camera|image|shot|picture/i)) {
        categories.push('photography');
    }
    
    if (content.match(/happy|festival|celebration|wish|diwali|onam|pongal|new year|christmas/i)) {
        categories.push('festivals');
    }
    
    if (content.match(/philosophy|spiritual|meditation|mindfulness|consciousness|buddha|shiva|vishnu|god|deity/i)) {
        categories.push('philosophy');
    }
    
    if (content.match(/patient|consult|report|assessment|therapy|medication|diagnosis|clinic|refer/i)) {
        categories.push('professional');
    }
    
    return categories.length ? categories : ['general'];
}

// Function to generate HTML from parsed messages
function generateChatHTML(messages) {
    // Implementation would go here
    // This would organize messages by year and category
    // and generate the HTML structure for the page
}