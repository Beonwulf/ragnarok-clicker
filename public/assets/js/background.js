// Three.js Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('background').appendChild(renderer.domElement);

// Particle System (e.g., glowing runes or stars)
const particles = new THREE.Geometry();
const material = new THREE.PointsMaterial({ color: 0x8B0000, size: 0.2 });

for (let i = 0; i < 1000; i++) {
	const x = (Math.random() - 0.5) * 100;
	const y = (Math.random() - 0.5) * 100;
	const z = (Math.random() - 0.5) * 100;
	particles.vertices.push(new THREE.Vector3(x, y, z));
}

const particleSystem = new THREE.Points(particles, material);
scene.add(particleSystem);

camera.position.z = 50;

function animate() {
	requestAnimationFrame(animate);
	particleSystem.rotation.y += 0.001; // Subtle rotation
	renderer.render(scene, camera);
}

animate();
