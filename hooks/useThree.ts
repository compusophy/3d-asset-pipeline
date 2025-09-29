import { useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export interface AnimationControls {
  play: () => void;
  pause: () => void;
  restart: () => void;
}

export const useThree = (code: string | null, animationCode: string | null = null) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const assetRef = useRef<THREE.Object3D | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const requestRef = useRef<number>();

  const cleanup = useCallback(() => {
     if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (rendererRef.current) {
        rendererRef.current.dispose();
        if (mountRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
            mountRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
    }
    mixerRef.current = null;
    actionRef.current = null;
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x111827);

    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controlsRef.current = controls;
    
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      if(mixerRef.current) {
        mixerRef.current.update(delta);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(entries => {
        if (!entries || entries.length === 0) return;
        const { width, height } = entries[0].contentRect;
        if (cameraRef.current && rendererRef.current) {
            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(width, height);
        }
    });

    resizeObserver.observe(currentMount);

    return () => {
      resizeObserver.disconnect();
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    if (code && sceneRef.current) {
      const scene = sceneRef.current;
      mixerRef.current = null;
      actionRef.current = null;
      
      if (assetRef.current) {
        scene.remove(assetRef.current);
        assetRef.current.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        assetRef.current = null;
      }

      try {
        const createAsset = new Function('THREE', 'BufferGeometryUtils', code);
        const newAsset = createAsset(THREE, BufferGeometryUtils);
        
        if (newAsset instanceof THREE.Object3D) {
            scene.add(newAsset);
            assetRef.current = newAsset;

            if (animationCode) {
                try {
                    let skinnedMesh: THREE.SkinnedMesh | null = null;
                    newAsset.traverse(object => {
                        if (object instanceof THREE.SkinnedMesh) {
                            skinnedMesh = object;
                        }
                    });

                    if (skinnedMesh) {
                        const boneNames = skinnedMesh.skeleton.bones.map(b => b.name);
                        const createAnimation = new Function('THREE', 'boneNames', animationCode);
                        const clip = createAnimation(THREE, boneNames);

                        if (clip instanceof THREE.AnimationClip) {
                            const mixer = new THREE.AnimationMixer(skinnedMesh);
                            const action = mixer.clipAction(clip);
                            action.setLoop(THREE.LoopRepeat, Infinity).play();
                            mixerRef.current = mixer;
                            actionRef.current = action;
                        } else {
                            console.error("Animation code did not return a THREE.AnimationClip object.");
                        }
                    } else {
                        console.warn("Animation code provided, but no SkinnedMesh found in the asset.");
                    }
                } catch (e) {
                     console.error("Error executing generated animation code:", e);
                }
            }

            if (cameraRef.current && controlsRef.current) {
                 const box = new THREE.Box3().setFromObject(newAsset);
                 const center = box.getCenter(new THREE.Vector3());
                 const size = box.getSize(new THREE.Vector3());
                 const maxDim = Math.max(size.x, size.y, size.z);
                 const fov = cameraRef.current.fov * (Math.PI / 180);
                 let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                 
                 cameraZ *= 1.5;
                 
                 cameraRef.current.position.z = center.z + cameraZ;
                 cameraRef.current.position.x = center.x;
                 cameraRef.current.position.y = center.y;
                 
                 controlsRef.current.target.copy(center);
                 controlsRef.current.update();
            }

        } else {
            console.error("Generated code did not return a valid THREE.Object3D.");
        }
      } catch (error) {
        console.error("Error executing generated Three.js code:", error);
      }
    }
  }, [code, animationCode]);

  const animationControls = useMemo<AnimationControls>(() => ({
    play: () => {
      if (actionRef.current) {
        actionRef.current.paused = false;
        if (!actionRef.current.isRunning()) {
          actionRef.current.play();
        }
      }
    },
    pause: () => {
      if (actionRef.current) {
        actionRef.current.paused = true;
      }
    },
    restart: () => {
      if (actionRef.current) {
        actionRef.current.reset().play();
        actionRef.current.paused = false;
      }
    },
  }), []);

  return { mountRef, animationControls };
};