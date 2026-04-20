import { Viewport } from 'pixi-viewport';
import { Application, Container } from 'pixi.js';

export interface PixiStageController {
  app: Application
  world: Container
  backgroundLayer: Container
  linkLayer: Container
  nodeLayer: Container
  overlayLayer: Container
  resize: () => void
  destroy: () => void
}

export async function createPixiStage(hostEl: HTMLElement): Promise<PixiStageController> {
  // Create a new application
  const app = new Application();


  // Initialize the application
  await app.init({ background: '#0b0d12', resizeTo: hostEl, antialias: true });
  const viewport = new Viewport({
    events: app.renderer.events,
  });


  viewport.drag().pinch().wheel().decelerate();

  const world = new Container({ label: 'world' })
  const backgroundLayer = new Container({ label: "backgroundLayer" })
  const linkLayer = new Container({ label: "linkLayer" })
  const nodeLayer = new Container({ label: "nodeLayer" })
  const overlayLayer = new Container({ label: "overlayLayer" })

  world.addChild(backgroundLayer, linkLayer, nodeLayer, overlayLayer)
  viewport.addChild(world);

  app.stage.addChild(viewport)

  hostEl.appendChild(app.canvas)

  const resize = () => {
    // add more logic if ever needed
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
  })

  const destroy = () => {
    resizeObserver.disconnect();
    if (app.canvas.parentNode === hostEl) {
      hostEl.removeChild(app.canvas)
    }

    app.destroy(true, {
      children: true,
    })
  }

  return {
    app,
    world,
    backgroundLayer,
    linkLayer,
    nodeLayer,
    overlayLayer,
    resize,
    destroy,
  }
}
