import type CreativeEngine from "@cesdk/engine";
import { useEffect, useRef, useState } from "react";

type CreativeEngineClass = typeof CreativeEngine;

function useEngine(): [
  React.MutableRefObject<CreativeEngine | null>,
  "idle" | "initializing" | "ready" | "error",
] {
  const [engineStatus, setEngineStatus] = useState<
    "idle" | "initializing" | "ready" | "error"
  >("idle");
  const engineInitializedRef = useRef(false);
  const engineRef = useRef<CreativeEngine | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || engineInitializedRef.current) {
      return;
    }
    try {
      setEngineStatus("initializing");
      import("@cesdk/engine").then(async (mod) => {
        const CreativeEngineModule: CreativeEngineClass =
          mod.default as any as CreativeEngineClass;

        const config = {
          license:
            "A-O53TWXK5bfyconUx7e53S5YU7DzjuGpMAH5vvKjLd0zBa6IhsoF7zChy1uCVbj",
          userId: "guides-user",
          baseURL:
            "https://cdn.img.ly/packages/imgly/cesdk-engine/1.44.0/assets",
        };

        const engine = await CreativeEngineModule.init(config);
        const container = document.getElementById("cesdk_container");
        if (container) {
          container.innerHTML = "";
          container.append(engine.element);
        }
        engineRef.current = engine;
        engineInitializedRef.current = true;
        setEngineStatus("ready");
      });
    } catch (error) {
      console.error("Error initializing CreativeEngine:", error);
      setEngineStatus("error");
    }
  }, []);

  return [engineRef, engineStatus];
}

export default useEngine;
