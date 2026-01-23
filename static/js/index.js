$(document).ready(function() {
  const options = {
    slidesToScroll: 1,
    slidesToShow: 1,
    loop: true,
    infinite: true,
    autoplay: false,
    autoplaySpeed: 3000,
  }
  // Initialize all div with carousel class
  const carousels = bulmaCarousel.attach('.carousel', options);

  // Initialize comparison carousel with specific settings
  const comparisonCarousel = bulmaCarousel.attach('#comparison-carousel', {
    slidesToScroll: 1,
    slidesToShow: 1,
    loop: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 5000,
    navigation: true,
    navigationKeys: true,
    navigationSwipe: true,
    pagination: true,
    effect: 'translate',
    duration: 600,
    timing: 'ease-in-out',
  });

  // Initialize qualitative comparison sample viewer
  initSampleViewer();
})

// Sample Viewer functionality
function initSampleViewer() {
  const samplesContainer = document.getElementById('samplesContainer');
  if (!samplesContainer) return;

  const samples = samplesContainer.querySelectorAll('.sample-item');
  const totalSamples = samples.length;
  let currentSample = 1;
  let isAnimating = false;

  const currentSampleEl = document.getElementById('currentSample');
  const totalSamplesEl = document.getElementById('totalSamples');
  const prevBtn = document.getElementById('prevSample');
  const nextBtn = document.getElementById('nextSample');

  // Set total samples count
  if (totalSamplesEl) {
    totalSamplesEl.textContent = totalSamples;
  }

  function showSample(newIndex, direction) {
    if (isAnimating || newIndex === currentSample) return;

    isAnimating = true;

    // Disable buttons during animation
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;

    const oldIndex = currentSample;

    // Add slide-out class to current sample
    const oldSample = samples[oldIndex - 1];
    const newSample = samples[newIndex - 1];

    if (direction === 'next') {
      oldSample.classList.add('slide-out-left');
    } else {
      oldSample.classList.add('slide-out-right');
    }

    // Wait for slide-out animation
    setTimeout(() => {
      // Remove active class from old sample
      oldSample.classList.remove('active', 'slide-out-left', 'slide-out-right');

      // Add active class to new sample
      newSample.classList.add('active');

      // Update counter
      if (currentSampleEl) {
        currentSampleEl.textContent = newIndex;
      }
      currentSample = newIndex;

      // Re-enable buttons after animation
      setTimeout(() => {
        isAnimating = false;
        if (prevBtn) prevBtn.disabled = false;
        if (nextBtn) nextBtn.disabled = false;
      }, 400);
    }, 200);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      let newIndex = currentSample - 1;
      if (newIndex < 1) newIndex = totalSamples;
      showSample(newIndex, 'prev');
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      let newIndex = currentSample + 1;
      if (newIndex > totalSamples) newIndex = 1;
      showSample(newIndex, 'next');
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      prevBtn?.click();
    } else if (e.key === 'ArrowRight') {
      nextBtn?.click();
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  loadTableData();
});

function loadTableData() {
  console.log('Starting to load table data...');
  fetch('./benchmark.json')
    .then(response => {
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data || !data.Generalized || !data.Specialized || !data.Ours) {
        throw new Error('Invalid data format');
      }
      console.log('Data loaded successfully:', data);
      const tbody = document.querySelector('#leaderboard-body');

      // Combine all data for ranking
      const allData = [...data.Generalized, ...data.Specialized, data.Ours];

      // Calculate best and second-best for each metric
      const metrics = [
        'Layout:Margin', 'Layout:Content', 'Layout:Area',
        'Legibility:Text', 'Legibility:Contrast', 'Legibility:LocCon',
        'Style:Palette', 'Style:Vibrancy', 'Style:Polarity',
        'Perceptual:SSIM', 'Perceptual:LPIPS', 'Perceptual:CLIP',
        'Geometry'
      ];

      const rankings = {};
      metrics.forEach(metric => {
        const isLowerBetter = metric === 'Perceptual:LPIPS';
        const values = allData.map((row, idx) => ({
          value: parseFloat(row[metric]),
          index: idx
        })).filter(item => !isNaN(item.value));

        values.sort((a, b) => isLowerBetter ? a.value - b.value : b.value - a.value);

        rankings[metric] = {};
        values.forEach((item, rank) => {
          rankings[metric][item.index] = rank;
        });
      });

      // Add Generalized section
      data.Generalized.forEach((row, index) => {
        const globalIndex = index;
        const tr = document.createElement('tr');
        tr.classList.add('generalized');

        // Add group label cell for first row
        if (index === 0) {
          const groupCell = `<td rowspan="${data.Generalized.length}" class="group-label">Generalized</td>`;
          tr.innerHTML = groupCell;
        }

        tr.innerHTML += `
          <td>${row.Methods}</td>
          <td>${applyStyle(row['Layout:Margin'], rankings['Layout:Margin'][globalIndex])}</td>
          <td>${applyStyle(row['Layout:Content'], rankings['Layout:Content'][globalIndex])}</td>
          <td>${applyStyle(row['Layout:Area'], rankings['Layout:Area'][globalIndex])}</td>
          <td>${applyStyle(row['Legibility:Text'], rankings['Legibility:Text'][globalIndex])}</td>
          <td>${applyStyle(row['Legibility:Contrast'], rankings['Legibility:Contrast'][globalIndex])}</td>
          <td>${applyStyle(row['Legibility:LocCon'], rankings['Legibility:LocCon'][globalIndex])}</td>
          <td>${applyStyle(row['Style:Palette'], rankings['Style:Palette'][globalIndex])}</td>
          <td>${applyStyle(row['Style:Vibrancy'], rankings['Style:Vibrancy'][globalIndex])}</td>
          <td>${applyStyle(row['Style:Polarity'], rankings['Style:Polarity'][globalIndex])}</td>
          <td>${applyStyle(row['Perceptual:SSIM'], rankings['Perceptual:SSIM'][globalIndex])}</td>
          <td>${applyStyle(row['Perceptual:LPIPS'], rankings['Perceptual:LPIPS'][globalIndex])}</td>
          <td>${applyStyle(row['Perceptual:CLIP'], rankings['Perceptual:CLIP'][globalIndex])}</td>
          <td>${applyStyle(row['Geometry'], rankings['Geometry'][globalIndex])}</td>
        `;

        tbody.appendChild(tr);
      });

      // Add Specialized section
      data.Specialized.forEach((row, index) => {
        const globalIndex = data.Generalized.length + index;
        const tr = document.createElement('tr');
        tr.classList.add('specialized');

        // Add group label cell for first row
        if (index === 0) {
          const groupCell = `<td rowspan="${data.Specialized.length}" class="group-label">Specialized</td>`;
          tr.innerHTML = groupCell;
        }

        tr.innerHTML += `
          <td>${row.Methods}</td>
          <td>${applyStyle(row['Layout:Margin'], rankings['Layout:Margin'][globalIndex])}</td>
          <td>${applyStyle(row['Layout:Content'], rankings['Layout:Content'][globalIndex])}</td>
          <td>${applyStyle(row['Layout:Area'], rankings['Layout:Area'][globalIndex])}</td>
          <td>${applyStyle(row['Legibility:Text'], rankings['Legibility:Text'][globalIndex])}</td>
          <td>${applyStyle(row['Legibility:Contrast'], rankings['Legibility:Contrast'][globalIndex])}</td>
          <td>${applyStyle(row['Legibility:LocCon'], rankings['Legibility:LocCon'][globalIndex])}</td>
          <td>${applyStyle(row['Style:Palette'], rankings['Style:Palette'][globalIndex])}</td>
          <td>${applyStyle(row['Style:Vibrancy'], rankings['Style:Vibrancy'][globalIndex])}</td>
          <td>${applyStyle(row['Style:Polarity'], rankings['Style:Polarity'][globalIndex])}</td>
          <td>${applyStyle(row['Perceptual:SSIM'], rankings['Perceptual:SSIM'][globalIndex])}</td>
          <td>${applyStyle(row['Perceptual:LPIPS'], rankings['Perceptual:LPIPS'][globalIndex])}</td>
          <td>${applyStyle(row['Perceptual:CLIP'], rankings['Perceptual:CLIP'][globalIndex])}</td>
          <td>${applyStyle(row['Geometry'], rankings['Geometry'][globalIndex])}</td>
        `;

        tbody.appendChild(tr);
      });

      // Add Ours row
      const oursRow = data.Ours;
      const oursGlobalIndex = data.Generalized.length + data.Specialized.length;
      const tr = document.createElement('tr');
      tr.classList.add('our_method');

      tr.innerHTML = `
        <td colspan="2" style="text-align: center; font-weight: bold;">${oursRow.Methods}</td>
        <td>${applyStyle(oursRow['Layout:Margin'], rankings['Layout:Margin'][oursGlobalIndex])}</td>
        <td>${applyStyle(oursRow['Layout:Content'], rankings['Layout:Content'][oursGlobalIndex])}</td>
        <td>${applyStyle(oursRow['Layout:Area'], rankings['Layout:Area'][oursGlobalIndex])}</td>
        <td>${applyStyle(oursRow['Legibility:Text'], rankings['Legibility:Text'][oursGlobalIndex])}</td>
        <td>${applyStyle(oursRow['Legibility:Contrast'], rankings['Legibility:Contrast'][oursGlobalIndex])}</td>
        <td>${applyStyle(oursRow['Legibility:LocCon'], rankings['Legibility:LocCon'][oursGlobalIndex])}</td>
        <td>${applyStyle(oursRow['Style:Palette'], rankings['Style:Palette'][oursGlobalIndex])}</td>
        <td>${applyStyle(oursRow['Style:Vibrancy'], rankings['Style:Vibrancy'][oursGlobalIndex])}</td>
        <td>${applyStyle(oursRow['Style:Polarity'], rankings['Style:Polarity'][oursGlobalIndex])}</td>
        <td>${applyStyle(oursRow['Perceptual:SSIM'], rankings['Perceptual:SSIM'][oursGlobalIndex])}</td>
        <td>${applyStyle(oursRow['Perceptual:LPIPS'], rankings['Perceptual:LPIPS'][oursGlobalIndex])}</td>
        <td>${applyStyle(oursRow['Perceptual:CLIP'], rankings['Perceptual:CLIP'][oursGlobalIndex])}</td>
        <td>${applyStyle(oursRow['Geometry'], rankings['Geometry'][oursGlobalIndex])}</td>
      `;

      tbody.appendChild(tr);
    })
    .catch(error => {
      console.error('Error loading table data:', error);
      const tbody = document.querySelector('#leaderboard-body');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="15">
              Error loading data: ${error.message}<br>
              Please ensure you're accessing this page through a web server (http://localhost:8000) and not directly from the file system.
            </td>
          </tr>
        `;
      }
    });
}

function applyStyle(value, rank) {
  if (value === undefined || value === null || value === '-') return '-';
  if (rank === 0) return `<b>${value}</b>`;
  if (rank === 1) return `<u>${value}</u>`;
  return value;
}
