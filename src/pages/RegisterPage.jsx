import React, { useState, useRef, useMemo, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function AnimatedGrid() {
  const mesh = useRef();
  const points = useRef();

  const [sphere] = useMemo(() => {
    const sphere = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);
      const x =
        Math.cos(theta) * Math.cos(phi) * THREE.MathUtils.randFloat(2, 4);
      const y =
        Math.sin(theta) * Math.cos(phi) * THREE.MathUtils.randFloat(2, 4);
      const z = Math.sin(phi) * THREE.MathUtils.randFloat(2, 4);
      sphere.set([x, y, z], i * 3);
    }
    return [sphere];
  }, []);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
      mesh.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.15) * 0.1;
    }
    if (points.current) {
      points.current.rotation.y += 0.001;
      points.current.rotation.x += 0.0005;
    }
  });

  return (
    <>
      {/* Grid Mesh */}
      <mesh ref={mesh} position={[0, 0, -8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30, 80, 80]} />
        <meshBasicMaterial
          color="#00ff88"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Floating Points */}
      <group ref={points}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={sphere.length / 3}
              array={sphere}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            transparent
            color="#22ff44"
            size={0.008}
            sizeAttenuation={true}
            depthWrite={false}
          />
        </points>
      </group>
    </>
  );
}

export default function RegisterPage() {
  const [registerData, setRegisterData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = import.meta.env.DEV ? "/api" : `${import.meta.env.VITE_BACKEND_URL}/api`;

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE}/v1/user/register`,
        {
          fullName: registerData.fullName,
          userName: registerData.username,
          email: registerData.email,
          password: registerData.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
          validateStatus: () => true, // allow handling all status codes
        }
      );
      if (response.status === 201 || response.status === 200) {
        // Tokens are handled via cookies, no localStorage needed
        navigate("/dashboard");
      } else if (response.status === 409) {
        window.alert("User already exists");
      } else {
        setError(
          response.data.message || "Registration failed. Please try again."
        );
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = `${
      import.meta.env.VITE_BACKEND_URL
    }/api/v1/user/auth/google`;
  };

  // Handle Google OAuth callback outcomes via query parameters (same behavior as LoginPage)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasCode = params.has("code");
    const hasState = params.has("state");
    const markers = [
      params.get("oauth"),
      params.get("status"),
      params.get("google"),
    ]
      .filter(Boolean)
      .map((v) => v.toLowerCase());

    if (markers.includes("success") || hasCode || (hasCode && hasState)) {
      navigate("/dashboard", { replace: true });
    } else if (
      markers.includes("error") ||
      markers.includes("failed") ||
      markers.includes("failure")
    ) {
      window.alert("Cannot use Google OAuth");
      navigate("/", { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Enhanced 3D Background */}
      <div className="fixed inset-0 -z-10">
        <Canvas
          camera={{ position: [0, 0, 1], fov: 75 }}
          style={{ background: "transparent" }}
        >
          <AnimatedGrid />
        </Canvas>
      </div>

      {/* Subtle Grid Overlay */}
      <div className="pointer-events-none fixed inset-0 -z-[9]">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
             linear-gradient(rgba(34, 255, 68, 0.08) 1px, transparent 1px),
             linear-gradient(90deg, rgba(34, 255, 68, 0.08) 1px, transparent 1px)
           `,
            backgroundSize: "50px 50px",
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
             linear-gradient(rgba(34, 255, 68, 0.12) 1px, transparent 1px),
             linear-gradient(90deg, rgba(34, 255, 68, 0.12) 1px, transparent 1px)
           `,
            backgroundSize: "10px 10px",
          }}
        />
      </div>

      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-black/90 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl"
        >
          {/* Register Heading */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-3xl sm:text-4xl font-bold text-green-400 text-center mb-8"
          >
            Register
          </motion.h1>

          {/* Google Auth Button - Top Position */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{
              scale: 1.03,
            }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleAuth}
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 hover:bg-white/20 text-sm sm:text-base"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.09-1.53-.25-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              ></path>
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 6.7 23 12 23z"
              ></path>
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.93z"
              ></path>
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 6.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              ></path>
            </svg>
            Sign up with Google
          </motion.button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-green-500/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-gray-300">OR</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4"
            >
              {error}
            </motion.div>
          )}

          {/* Registration Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onSubmit={handleRegisterSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={registerData.fullName}
                onChange={handleRegisterChange}
                className="w-full bg-gray-900/50 border border-green-500/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400/50 transition-all backdrop-blur-sm text-sm sm:text-base"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={registerData.username}
                onChange={handleRegisterChange}
                className="w-full bg-gray-900/50 border border-green-500/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400/50 transition-all backdrop-blur-sm text-sm sm:text-base"
                placeholder="Choose a username"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                className="w-full bg-gray-900/50 border border-green-500/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400/50 transition-all backdrop-blur-sm text-sm sm:text-base"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  className="w-full bg-gray-900/50 border border-green-500/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400/50 transition-all backdrop-blur-sm text-sm sm:text-base pr-10"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={handleTogglePassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-400 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.122-6.13M6.13 6.13A9.96 9.96 0 0112 3c5.523 0 10 4.477 10 10 0 2.21-.715 4.25-1.925 5.925M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <line
                        x1="3"
                        y1="3"
                        x2="21"
                        y2="21"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  className="w-full bg-gray-900/50 border border-green-500/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400/50 transition-all backdrop-blur-sm text-sm sm:text-base pr-10"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={handleToggleConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-400 focus:outline-none"
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.122-6.13M6.13 6.13A9.96 9.96 0 0112 3c5.523 0 10 4.477 10 10 0 2.21-.715 4.25-1.925 5.925M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <line
                        x1="3"
                        y1="3"
                        x2="21"
                        y2="21"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{
                scale: 1.03,
              }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-accent-light text-black font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-300 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </motion.button>
          </motion.form>

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center mt-6"
          >
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-green-400 hover:text-green-300 font-semibold transition-colors"
              >
                Sign In
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
