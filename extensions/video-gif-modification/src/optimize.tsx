import { Toast as RaycastToast, showToast } from "@raycast/api";
import * as path from "path";
import { Ffmpeg } from "./objects/ffmpeg";
import { Ffprobe } from "./objects/ffprobe";
import { SelectedFinderFiles } from "./objects/selected-finder.files";
import { Toast } from "./objects/toast";
import { Video } from "./objects/video";

export default async function Command(props: { arguments: { preset: "smallest-size" | "optimal" | "best-quality" } }) {
  const toast = new Toast();

  try {
    const { preset } = props.arguments;

    const files = await new SelectedFinderFiles().list();

    if (files.length === 0) {
      await toast.show({ title: "Please select any video in Finder", style: RaycastToast.Style.Failure });
      return;
    }

    const ffmpeg = new Ffmpeg(
      new Ffprobe({
        onStatusChange: async (status) => {
          await toast.show({ title: status, style: RaycastToast.Style.Animated });
        },
      }),
      {
        onStatusChange: async (status) => {
          await toast.show({ title: status, style: RaycastToast.Style.Animated });
        },
        onProgressChange: async (progress) => {
          await toast.updateProgress(Math.round(progress * 100));
        },
      },
    );

    for (const file of files) {
      try {
        const extension = path.extname(file.path());
        if (extension === ".gif") {
          throw new Error("Does not applicable to GIFs yet");
        } else {
          await new Video(file, ffmpeg).encode({ preset });
        }
      } catch (err) {
        if (err instanceof Error) {
          await showToast({ title: err.message, style: RaycastToast.Style.Failure });
        }
        return;
      }
    }

    await showToast({ title: "All videos processed", style: RaycastToast.Style.Success });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      await toast.show({ title: err.message, style: RaycastToast.Style.Failure });
    }
  }
}
