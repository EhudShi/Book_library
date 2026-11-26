// Adds the interactive parts to every book page, from the page's existing HTML:
// 1. An "idea cards" deck built from each section's .key line.
// 2. The practical steps (.todo li) become a checklist saved in this browser.
// Nothing needs to change in a book page to get these.
(function(){
  var slug = location.pathname.split('/').pop().replace(/\.html$/, '') || 'book';
  var store = {
    get: function(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } },
    set: function(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  };

  // ---------- Idea deck ----------
  var header = document.querySelector('.wrap > header');
  var ideas = [];
  document.querySelectorAll('.wrap section').forEach(function(sec, si){
    var h = sec.querySelector('h2');
    if (!sec.id) sec.id = 's' + (si + 1);
    var title = h ? h.textContent.replace(/^\s*\d+\s*/, '').trim() : '';
    sec.querySelectorAll('.key').forEach(function(k){ ideas.push({ text: k.textContent.trim(), title: title, id: sec.id }); });
  });
  if (header && ideas.length){
    var deck = document.createElement('div');
    deck.className = 'deck';
    deck.innerHTML = '<div class="deck-head"><h2>הרעיונות בכרטיסים</h2><span id="deck-pos"></span></div>' +
      '<div class="cards" id="cards" tabindex="0" aria-label="כרטיסי רעיונות, אפשר לגלול הצידה"></div><div class="dots" id="dots"></div>';
    header.after(deck);
    var cards = deck.querySelector('#cards'), dots = deck.querySelector('#dots'), pos = deck.querySelector('#deck-pos');
    ideas.forEach(function(it, i){
      var c = document.createElement('article');
      c.className = 'fc';
      c.innerHTML = '<small></small><p></p><a></a>';
      c.querySelector('small').textContent = 'רעיון ' + (i + 1) + ' מתוך ' + ideas.length + (it.title ? ' · ' + it.title : '');
      c.querySelector('p').textContent = it.text;
      var a = c.querySelector('a'); a.href = '#' + it.id; a.textContent = 'לקרוא את הפרק';
      cards.appendChild(c);
      var d = document.createElement('button');
      d.type = 'button'; d.setAttribute('aria-label', 'רעיון ' + (i + 1));
      d.onclick = function(){ c.scrollIntoView({ block: 'nearest', inline: 'center' }); };
      dots.appendChild(d);
    });
    function mark(){
      var r = cards.getBoundingClientRect(), mid = r.left + r.width / 2, best = 0, bestD = 1e9;
      Array.prototype.forEach.call(cards.children, function(c, i){
        var b = c.getBoundingClientRect(), dd = Math.abs(b.left + b.width / 2 - mid);
        if (dd < bestD){ bestD = dd; best = i; }
      });
      Array.prototype.forEach.call(dots.children, function(d, i){ d.setAttribute('aria-current', i === best); });
      pos.textContent = (best + 1) + ' / ' + ideas.length;
    }
    var t; cards.addEventListener('scroll', function(){ clearTimeout(t); t = setTimeout(mark, 60); });
    mark();
  }

  // ---------- Steps checklist ----------
  var todo = document.querySelector('.todo');
  if (!todo) return;
  var items = todo.querySelectorAll('li');
  if (!items.length) return;
  var key = 'lib:steps:' + slug;
  var saved = store.get(key) || [];
  var prog = document.createElement('div');
  prog.className = 'todo-progress';
  prog.innerHTML = '<div class="bar"><i></i></div><span></span>';
  var h = todo.querySelector('h2');
  if (h) h.after(prog); else todo.prepend(prog);
  var pill = document.createElement('span');
  pill.className = 'pill';
  var nav = document.querySelector('.topnav');
  if (nav) nav.appendChild(pill);
  var boxes = [];
  items.forEach(function(li, i){
    var label = document.createElement('label');
    label.className = 'step';
    var box = document.createElement('input');
    box.type = 'checkbox'; box.checked = !!saved[i];
    var span = document.createElement('span');
    while (li.firstChild) span.appendChild(li.firstChild);
    label.appendChild(box); label.appendChild(span); li.appendChild(label);
    box.addEventListener('change', update);
    boxes.push(box);
  });
  function update(){
    var done = boxes.filter(function(b){ return b.checked; }).length;
    store.set(key, boxes.map(function(b){ return b.checked; }));
    store.set('lib:progress:' + slug, { done: done, total: boxes.length });
    prog.querySelector('i').style.width = (100 * done / boxes.length) + '%';
    prog.querySelector('span').textContent = done + ' מתוך ' + boxes.length + ' צעדים';
    pill.textContent = done === boxes.length ? 'הכול יושם' : done + '/' + boxes.length + ' צעדים';
  }
  update();
})();
