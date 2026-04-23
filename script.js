// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Resume: open in new tab + trigger download (both behaviors)
document.querySelectorAll('a[data-resume]').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const href = this.getAttribute('href');
    // 1. Open the PDF in a new tab
    window.open(href, '_blank', 'noopener');
    // 2. Also trigger a direct download
    const dl = document.createElement('a');
    dl.href = href;
    dl.download = href.split('/').pop();
    dl.style.display = 'none';
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  });
});

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

// Typewriter effect for the role line
const tw = document.querySelector('.typewriter');
if (tw && window.innerWidth > 900) {
  const phrases = [
    'Full Stack Developer',
    'Java Backend Engineer',
    'AI/ML Engineer',
    'Solana Blockchain Developer',
    'Cloud-Native Architect'
  ];
  let pi = 0, ci = 0, deleting = false;
  function type() {
    const cur = phrases[pi];
    tw.textContent = deleting ? cur.slice(0, --ci) : cur.slice(0, ++ci);
    let speed = deleting ? 40 : 90;
    if (!deleting && ci === cur.length) { speed = 1800; deleting = true; }
    else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; speed = 350; }
    setTimeout(type, speed);
  }
  setTimeout(type, 800);
}

// Reveal-on-scroll
const reveal = (entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = 1; e.target.style.transform = 'translateY(0)'; } });
};
const obs = new IntersectionObserver(reveal, { threshold: 0.1 });
document.querySelectorAll('.skill-card, .proj-card, .t-card, .edu-card, .stat, .contact-card').forEach(el => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  obs.observe(el);
});
