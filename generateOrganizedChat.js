#!/usr/bin/env node

/**
 * WhatsApp Chat Organizer
 * 
 * This script reads the WhatsApp chat export and generates a complete organized HTML
 */

const fs = require('fs');
const path = require('path');

// Read the WhatsApp chat file
function readChatFile() {
    const chatPath = path.join(__dirname, 'WhatsApp Chat with Dr Raguram.txt');
    return fs.readFileSync(chatPath, 'utf8');
}

// Parse WhatsApp chat messages
function parseWhatsAppChat(chatText) {
    const lines = chatText.split('\n');
    const messages = [];
    let currentMessage = null;
    
    for (const line of lines) {
        // Match the date/time pattern at the beginning of messages
        const dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{1,2}), (\d{1,2}:\d{1,2}\s*[ap]m) - ([^:]+): (.*)/i);
        
        if (dateMatch) {
            // If we find a new message pattern, save the previous message if it exists
            if (currentMessage) {
                messages.push(currentMessage);
            }
            
            // Extract year from date
            const dateParts = dateMatch[1].split('/');
            let year = dateParts[2];
            if (year.length === 2) {
                // Assume 2-digit years are in 2000s for this chat
                year = '20' + year;
            }
            
            // Create a new message object
            currentMessage = {
                date: dateMatch[1],
                time: dateMatch[2],
                sender: dateMatch[3].trim(),
                content: dateMatch[4],
                year: year,
                month: dateParts[1],
                day: dateParts[0],
                categories: categorizeMessage(dateMatch[4])
            };
        } else if (currentMessage && line.trim()) {
            // If no date pattern, this is a continuation of the previous message
            currentMessage.content += '\n' + line;
            // Re-categorize with the updated content
            currentMessage.categories = categorizeMessage(currentMessage.content);
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
    const lowerContent = content.toLowerCase();
    
    // Check for media
    if (content.includes('<Media omitted>')) {
        categories.push('media');
    }
    
    // Check for blog posts
    if (content.match(/http:\/\/www\.profraguram\.com|https:\/\/www\.profraguram\.com/)) {
        categories.push('blog-posts');
    }
    
    // Check for art and culture keywords
    if (lowerContent.match(/temple|sculpture|art|architecture|heritage|monument|hampi|angkor|kanchipuram|lepakshi|banteay|hoysala|vijayanagar|khmer|gopuram|mural|carving|statue|shiva|vishnu|ganesha|durga|mahisasura|deity|devi|kailasanathar|nuggehalli|mosale/)) {
        categories.push('art-culture');
    }
    
    // Check for photography keywords
    if (lowerContent.match(/photo|photograph|camera|image|shot|picture|lens|light|captured|frame|beauty|landscape|portrait|sunrise|sunset|big sur|bixby|monarch|butterfly|bird|nature/)) {
        categories.push('photography');
    }
    
    // Check for festivals and celebrations
    if (lowerContent.match(/happy|festival|celebration|wish|diwali|deepavali|onam|pongal|new year|christmas|ganesha|chaturthi|navaratri|teacher's day|shivarathri|durga|ashtami/)) {
        categories.push('festivals');
    }
    
    // Check for philosophy and spirituality
    if (lowerContent.match(/philosophy|spiritual|meditation|mindfulness|consciousness|buddha|dharma|enlightenment|soul|peace|divine|sacred|blessing|prayer|devotion|transcend|sublime|within|haiku|reflection|musing|contemplat|introspect/)) {
        categories.push('philosophy');
    }
    
    // Check for professional/medical content
    if (lowerContent.match(/patient|consult|report|assessment|therapy|medication|diagnosis|clinic|refer|resperidone|prodep|swimming|dr\.|sir|medical|treatment|session|psychology|clinical|nimhans|prabhu/)) {
        categories.push('professional');
    }
    
    // General conversation if no specific category
    if (categories.length === 0) {
        categories.push('general');
    }
    
    return categories;
}

// Group messages by year and category
function groupMessages(messages) {
    const grouped = {};
    
    messages.forEach(message => {
        if (!grouped[message.year]) {
            grouped[message.year] = {};
        }
        
        message.categories.forEach(category => {
            if (!grouped[message.year][category]) {
                grouped[message.year][category] = [];
            }
            grouped[message.year][category].push(message);
        });
    });
    
    return grouped;
}

// Generate HTML for messages
function generateMessageHTML(message) {
    const senderClass = message.sender.toLowerCase().includes('raguram') ? 'raguram' : 'nalini';
    let content = message.content;
    
    // Convert URLs to links
    content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" class="blog-link" target="_blank">$1</a>');
    
    // Handle media omitted
    if (content.includes('<Media omitted>')) {
        content = content.replace('<Media omitted>', '<div class="media-indicator">[Media omitted]</div>');
    }
    
    // Handle multi-line content
    content = content.replace(/\n/g, '<br>');
    
    return `
        <div class="message ${senderClass}">
            <div class="date">${message.date}, ${message.time}</div>
            ${content}
        </div>`;
}

// Generate category section HTML
function generateCategoryHTML(categoryName, messages) {
    const categoryClass = categoryName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const displayName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1).replace('-', ' & ');
    
    const messagesHTML = messages.map(generateMessageHTML).join('\n');
    
    return `
        <div class="category ${categoryClass}">
            <h3>${displayName}</h3>
            ${messagesHTML}
        </div>`;
}

// Generate year section HTML
function generateYearHTML(year, categories) {
    const categoriesHTML = Object.entries(categories)
        .filter(([categoryName]) => categoryName !== 'media') // Skip media-only category
        .map(([categoryName, messages]) => generateCategoryHTML(categoryName, messages))
        .join('\n');
    
    return `
        <h2 id="${year}" class="year">${year}</h2>
        ${categoriesHTML}`;
}

// Generate complete HTML
function generateCompleteHTML(groupedMessages) {
    const years = Object.keys(groupedMessages).sort();
    const allCategories = new Set();
    
    // Collect all categories across all years
    Object.values(groupedMessages).forEach(yearData => {
        Object.keys(yearData).forEach(category => {
            if (category !== 'media') {
                allCategories.add(category);
            }
        });
    });
    
    const yearButtons = years.map(year => 
        `<button class="year-button" onclick="filterByYear('${year}')">${year}</button>`
    ).join('\n            ');
    
    const categoryButtons = Array.from(allCategories).map(category => {
        const displayName = getDisplayName(category);
        return `<button class="category-button" onclick="filterByCategory('${category}')">${displayName}</button>`;
    }).join('\n            ');

function getDisplayName(category) {
    const displayNames = {
        'art-culture': 'Art & Culture',
        'photography': 'Photography', 
        'blog-posts': 'Blog Posts',
        'festivals': 'Festivals & Celebrations',
        'philosophy': 'Philosophy & Spirituality',
        'professional': 'Professional Communications',
        'general': 'General'
    };
    return displayNames[category] || category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' & ');
}
    
    const contentHTML = years.map(year => generateYearHTML(year, groupedMessages[year])).join('\n        ');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Chat with Dr Raguram - Organized</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        h1 {
            color: #075e54;
            border-bottom: 2px solid #075e54;
            padding-bottom: 10px;
        }
        
        h2 {
            color: #128c7e;
            margin-top: 30px;
            border-bottom: 1px solid #128c7e;
            padding-bottom: 5px;
        }
        
        h3 {
            color: #25d366;
            margin-top: 20px;
        }
        
        .toc {
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        
        .toc a {
            color: #128c7e;
            text-decoration: none;
        }
        
        .toc a:hover {
            text-decoration: underline;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 8px;
        }
        
        .raguram {
            background-color: #dcf8c6;
            margin-left: 20px;
            border-left: 3px solid #25d366;
        }
        
        .nalini {
            background-color: #ececec;
            margin-right: 20px;
            border-left: 3px solid #075e54;
        }
        
        .date {
            font-size: 0.8em;
            color: #888;
            margin-bottom: 5px;
        }
        
        .media-indicator {
            font-style: italic;
            color: #888;
        }
        
        .category-nav {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 20px 0;
        }
        
        .category-button {
            background-color: #128c7e;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .category-button:hover {
            background-color: #075e54;
        }
        
        .year-nav {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 20px 0;
        }
        
        .year-button {
            background-color: #25d366;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .year-button:hover {
            background-color: #128c7e;
        }
        
        .hidden {
            display: none;
        }
        
        .blog-link {
            color: #075e54;
            text-decoration: none;
            font-weight: bold;
        }
        
        .blog-link:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            
            .category-nav, .year-nav {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .category-button, .year-button {
                width: 100%;
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <h1>WhatsApp Chat with Dr Raguram - Organized</h1>
    
    <div class="toc">
        <h2>Navigation</h2>
        <h3>Search Messages</h3>
        <div class="search-container">
            <input type="text" id="searchInput" class="search-input" placeholder="Search messages..." onkeyup="searchMessages()">
            <div id="searchResults" class="search-results"></div>
        </div>
        
        <div class="stats">
            <strong>Chat Statistics:</strong> ${Object.values(groupedMessages).reduce((total, year) => total + Object.values(year).reduce((sum, msgs) => sum + msgs.length, 0), 0)} messages across ${years.length} years (${years[0]}-${years[years.length-1]}) | 
            Categories: ${Array.from(allCategories).map(cat => getDisplayName(cat)).join(', ')}
        </div>
        
        <h3>Browse by Year</h3>
        <div class="year-nav">
            ${yearButtons}
            <button class="year-button" onclick="showAllYears()">Show All</button>
        </div>
        
        <h3>Browse by Category</h3>
        <div class="category-nav">
            ${categoryButtons}
            <button class="category-button" onclick="showAllCategories()">Show All</button>
        </div>
    </div>
    
    <div id="content">
        ${contentHTML}
    </div>
    
    <script>
        function filterByYear(year) {
            // Hide all year sections
            const yearElements = document.querySelectorAll('.year');
            yearElements.forEach(element => {
                const section = element.parentElement;
                while (section.nextElementSibling && !section.nextElementSibling.classList.contains('year')) {
                    section.nextElementSibling.classList.add('hidden');
                }
                element.classList.add('hidden');
            });
            
            // Show only the selected year and its content
            const selectedYear = document.getElementById(year);
            if (selectedYear) {
                selectedYear.classList.remove('hidden');
                let nextElement = selectedYear.nextElementSibling;
                while (nextElement && !nextElement.classList.contains('year')) {
                    nextElement.classList.remove('hidden');
                    nextElement = nextElement.nextElementSibling;
                }
            }
        }
        
        function showAllYears() {
            const yearElements = document.querySelectorAll('.year');
            const categoryElements = document.querySelectorAll('.category');
            yearElements.forEach(element => {
                element.classList.remove('hidden');
            });
            categoryElements.forEach(element => {
                element.classList.remove('hidden');
            });
        }
        
        function filterByCategory(category) {
            // Hide all categories
            const categoryElements = document.querySelectorAll('.category');
            categoryElements.forEach(element => {
                element.classList.add('hidden');
            });
            
            // Hide all year headings
            const yearElements = document.querySelectorAll('.year');
            yearElements.forEach(element => {
                element.classList.add('hidden');
            });
            
            // Show only the selected category and relevant year headings
            const selectedCategories = document.querySelectorAll('.' + category);
            selectedCategories.forEach(element => {
                element.classList.remove('hidden');
                // Find and show the year heading for this category
                let prevElement = element.previousElementSibling;
                while (prevElement) {
                    if (prevElement.classList.contains('year')) {
                        prevElement.classList.remove('hidden');
                        break;
                    }
                    prevElement = prevElement.previousElementSibling;
                }
            });
        }
        
        function showAllCategories() {
            const categoryElements = document.querySelectorAll('.category');
            const yearElements = document.querySelectorAll('.year');
            categoryElements.forEach(element => {
                element.classList.remove('hidden');
            });
            yearElements.forEach(element => {
                element.classList.remove('hidden');
            });
        }
    </script>
</body>
</html>`;
}

// Main function
function main() {
    console.log('Reading WhatsApp chat file...');
    const chatText = readChatFile();
    
    console.log('Parsing messages...');
    const messages = parseWhatsAppChat(chatText);
    console.log(`Found ${messages.length} messages`);
    
    console.log('Grouping messages by year and category...');
    const groupedMessages = groupMessages(messages);
    
    // Print summary
    Object.entries(groupedMessages).forEach(([year, categories]) => {
        const totalMessages = Object.values(categories).reduce((sum, msgs) => sum + msgs.length, 0);
        console.log(`${year}: ${totalMessages} messages across ${Object.keys(categories).length} categories`);
    });
    
    console.log('Generating HTML...');
    const html = generateCompleteHTML(groupedMessages);
    
    console.log('Writing organized chat to index.html...');
    fs.writeFileSync(path.join(__dirname, 'index.html'), html);
    
    console.log('✅ Complete! WhatsApp chat has been organized and saved to index.html');
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    parseWhatsAppChat,
    categorizeMessage,
    groupMessages,
    generateCompleteHTML
};