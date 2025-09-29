import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const useThree = (code: string | null) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const assetGroupRef = useRef<THREE.Group | null>(null);

  const cleanup = useCallback(() => {
    if (rendererRef.current) {
        rendererRef.current.dispose();
        if (mountRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
            mountRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Basic setup
    const currentMount = mountRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x111827); // bg-gray-900

    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controlsRef.current = controls;

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!currentMount || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    if (code && sceneRef.current) {
      const scene = sceneRef.current;
      
      // Clear previous asset
      if (assetGroupRef.current) {
        scene.remove(assetGroupRef.current);
        assetGroupRef.current.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        assetGroupRef.current = null;
      }

      try {
        // Execute new code, which should return a THREE.Group
        const createAsset = new Function('THREE', code);
        const newGroup = createAsset(THREE);
        
        if (newGroup instanceof THREE.Group) {
            scene.add(newGroup);
            assetGroupRef.current = newGroup;

            // Optional: Auto-focus camera on the new object
            if (cameraRef.current && controlsRef.current) {
                 const box = new THREE.Box3().setFromObject(newGroup);
                 const center = box.getCenter(new THREE.Vector3());
                 const size = box.getSize(new THREE.Vector3());
                 const maxDim = Math.max(size.x, size.y, size.z);
                 const fov = cameraRef.current.fov * (Math.PI / 180);
                 let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                 
                 cameraZ *= 1.5; // zoom out a bit
                 
                 cameraRef.current.position.z = center.z + cameraZ;
                 cameraRef.current.position.x = center.x;
                 cameraRef.current.position.y = center.y;
                 
                 controlsRef.current.target.copy(center);
                 controlsRef.current.update();
            }

        } else {
            console.error("Generated code did not return a THREE.Group object.");
        }
      } catch (error) {
        console.error("Error executing generated Three.js code:", error);
      }
    }
  }, [code]);

  return mountRef;
};