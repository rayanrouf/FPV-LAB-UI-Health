document.addEventListener('DOMContentLoaded', () => {
    const camToggle = document.getElementById('camToggle');
    camToggle.checked = localStorage.getItem('cameraVisible') === 'true';

    camToggle.addEventListener('change', () => {
        localStorage.setItem('cameraVisible', camToggle.checked);
    });
});
