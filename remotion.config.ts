import { Config } from "@remotion/cli/config";

// Rendering defaults. Everything here can be overridden on the command line.
Config.setEntryPoint("src/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setCrf(17);
Config.setPixelFormat("yuv420p");
Config.setAudioBitrate("320k");
Config.setOverwriteOutput(true);
// Software GL that supports blur and backdrop-filter in headless Chrome.
Config.setChromiumOpenGlRenderer("swangle");
