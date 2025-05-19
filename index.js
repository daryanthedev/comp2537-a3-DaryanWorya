// index.js
$(document).ready(async function() {
  let firstCard    = null,
      secondCard   = null,
      boardLocked  = false,
      moves        = 0,
      matchedPairs = 0,
      totalPairs   = 0,
      timerInterval= null,
      timeLeft     = 0,
      allPokemon   = [];

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function updateStatus() {
    $('#moves').text(`Moves: ${moves}`);
    $('#pairsLeft').text(`Pairs Left: ${totalPairs - matchedPairs}`);
    $('#timer').text(`Time: ${timeLeft}`);
  }

  function setupCards() {
    $('.card').on('click', function () {
      if (boardLocked) return;
      if ($(this).hasClass('flipped')) return;

      $(this).addClass('flipped');
      if (!firstCard) {
        firstCard = $(this);
        return;
      }

      secondCard = $(this);
      boardLocked = true;
      moves++;
      updateStatus();
      checkForMatch();
    });
  }

  function checkForMatch() {
    const img1 = firstCard.find('.front_face')[0].src;
    const img2 = secondCard.find('.front_face')[0].src;

    if (img1 === img2) {
      firstCard.add(secondCard)
               .addClass('matched')
               .off('click');
      matchedPairs++;
      resetTurn();
      updateStatus();
      if (matchedPairs === totalPairs) endGame(true);
    } else {
      setTimeout(() => {
        firstCard.removeClass('flipped');
        secondCard.removeClass('flipped');
        resetTurn();
      }, 1000);
    }
  }

  function resetTurn() {
    [firstCard, secondCard] = [null, null];
    boardLocked = false;
  }

  function startTimer(duration) {
    clearInterval(timerInterval);
    timeLeft = duration;
    updateStatus();
    timerInterval = setInterval(() => {
      timeLeft--;
      updateStatus();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endGame(false);
      }
    }, 1000);
  }

  function endGame(won) {
    clearInterval(timerInterval);
    boardLocked = true;
    $('.card').off('click');
    setTimeout(() => {
      alert(won ? 'You win!' : 'Time’s up!');
    }, 200);
  }

  async function startGame() {
    clearInterval(timerInterval);
    moves = matchedPairs = 0;
    firstCard = secondCard = null;
    boardLocked = false;

    const diff = $('#difficulty').val();
    let pairs, timeLimit;
    if (diff === 'easy')       [pairs, timeLimit] = [3,  60];
    else if (diff === 'medium') [pairs, timeLimit] = [6,  90];
    else                        [pairs, timeLimit] = [9, 120];

    totalPairs = pairs;
    await generateBoardFromAPI(pairs);
    updateStatus();
    setupCards();
    startTimer(timeLimit);
  }

  function resetGame() {
    clearInterval(timerInterval);
    $('#game_grid').empty();
    moves = matchedPairs = 0;
    updateStatus();
    $('#timer').text(`Time: 0`);
  }

  function toggleTheme() {
    const next = $('body').attr('data-theme') === 'dark' ? 'light' : 'dark';
    $('body').attr('data-theme', next);
    $('#theme-toggle').text(next === 'dark' ? 'Light Mode' : 'Dark Mode');
  }

  function peekCards() {
    if (boardLocked) return;
    boardLocked = true;
    $('.card:not(.flipped)').addClass('flipped');
    setTimeout(() => {
      $('.card:not(.matched)').removeClass('flipped');
      boardLocked = false;
    }, 1500);
  }

  async function loadPokemonList() {
    const res  = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1500');
    const data = await res.json();
    allPokemon = data.results;
  }

  function pickRandomPokemon(n) {
    const copy = allPokemon.slice();
    const picked = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      picked.push(copy.splice(idx, 1)[0]);
    }
    return picked;
  }

  async function fetchArtwork(poke) {
    const res  = await fetch(poke.url);
    const data = await res.json();
    return (
      data.sprites.other['official-artwork'].front_default ||
      data.sprites.front_default  ||
      ''
    );
  }

  async function generateBoardFromAPI(pairCount) {
    const picks  = pickRandomPokemon(pairCount);
    const images = await Promise.all(picks.map(fetchArtwork));
    const deck   = shuffle(images.concat(images));

    $('#game_grid')
      .empty()
      .removeClass('easy medium hard')
      .addClass($('#difficulty').val());

    deck.forEach(src => {
      const $card = $('<div>').addClass('card');
      $('<img>').addClass('front_face').attr('src', src).appendTo($card);
      $('<img>').addClass('back_face').attr('src', 'back.webp').appendTo($card);
      $('#game_grid').append($card);
    });
  }

  await loadPokemonList();
  updateStatus();

  $('#start').on('click', startGame);
  $('#reset').on('click', resetGame);
  $('#theme-toggle').on('click', toggleTheme);
  $('#peek').on('click', peekCards);
  
});
