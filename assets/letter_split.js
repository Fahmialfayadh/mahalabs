
// Letter Splitting for Hero Title
const heroTitle = document.getElementById('hero-title');
if (heroTitle) {
    const text = heroTitle.textContent;
    heroTitle.textContent = '';

    // Split text into words
    const words = text.split(' ');

    words.forEach((word, wordIndex) => {
        // Create a container for the word to ensure it wraps as a whole unit
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap'; // Prevent breaking inside the word
        wordSpan.style.marginRight = '0.3em'; // Space between words

        // Split word into characters
        word.split('').forEach((char, charIndex) => {
            const span = document.createElement('span');
            span.textContent = char;

            // Calculate delay based on global index to maintain flow
            // We can just define a running index, but simple staggering is fine
            // Let's use a rough estimate or pass a counter if we want perfect linear delay
            // For now, simple index within word + word offset is okay, or just random

            span.classList.add('letter-anim');
            span.style.display = 'inline-block';
            wordSpan.appendChild(span);
        });

        heroTitle.appendChild(wordSpan);
    });

    // Re-apply delays globally to ensure left-to-right flow
    const allLetters = heroTitle.querySelectorAll('.letter-anim');
    allLetters.forEach((span, index) => {
        span.style.animationDelay = `${index * 0.1}s`;
    });
}
