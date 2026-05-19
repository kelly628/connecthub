const KEY = 'ctd_projects';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || seed(); }
  catch { return seed(); }
}

function save(projects) {
  localStorage.setItem(KEY, JSON.stringify(projects));
}

function seed() {
  const data = [
    {
      id: '1',
      name: 'Spring Gala',
      date: '2026-05-30',
      leads: 'Ms. Kelly',
      blessed: true,
      dots: [
        { member: 'Sarah M.',    responsibilities: [{ text: 'Venue setup', done: false }, { text: 'Table linens', done: true }, { text: 'Centerpieces', done: false }] },
        { member: 'James R.',    responsibilities: [{ text: 'Audio/visual setup', done: false }, { text: 'Microphone check', done: false }, { text: 'Slideshow prep', done: false }] },
        { member: 'Tina B.',     responsibilities: [{ text: 'Ticket sales', done: true }, { text: 'RSVPs', done: true }, { text: 'Check-in table', done: false }] },
        { member: 'Coach Davis', responsibilities: [{ text: 'Recruit student volunteers', done: false }, { text: 'Assign volunteer roles', done: false }] },
        { member: 'Mr. Lopez',   responsibilities: [{ text: 'Catering liaison', done: false }, { text: 'Menu approval', done: true }] },
        { member: 'Mrs. Green',  responsibilities: [{ text: 'Send invitations', done: true }, { text: 'Printed programs', done: false }] },
        { member: 'Dana K.',     responsibilities: [{ text: 'Social media posts', done: false }, { text: 'Event photography', done: false }] },
        { member: 'Fr. Thomas',  responsibilities: [{ text: 'Opening prayer', done: false }, { text: 'Benediction', done: false }] },
      ],
    },
  ];
  save(data);
  return data;
}

const TEAM_KEY = 'ctd_team';

function loadTeam() {
  try { return JSON.parse(localStorage.getItem(TEAM_KEY)) || []; }
  catch { return []; }
}

function saveTeam(team) {
  localStorage.setItem(TEAM_KEY, JSON.stringify(team));
}

export { load, save, loadTeam, saveTeam };
