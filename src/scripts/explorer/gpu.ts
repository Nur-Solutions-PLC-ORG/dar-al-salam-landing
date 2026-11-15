/**
 * Who may press "Render this view" (DESIGN §9.10 F7): a desktop with a real GPU. Shared by the controller (the
 * button) and render-still (a second check before tracing). Kept tiny so the controller doesn't pull in the tracer.
 * Review r9 final H1: software renderers (SwiftShader, llvmpipe, …) pass the feature checks but take minutes per
 * sample, so they are refused by name.
 * Coordinator (after review r9): also behind `?still` until the user confirms it on a real GPU.
 */
export function canRenderStill(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  if (!new URLSearchParams(location.search).has('still')) return false;
  if (!matchMedia('(pointer: fine)').matches) return false;
  if (((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) < 8) return false;
  if (typeof WebGL2RenderingContext === 'undefined' || !(gl instanceof WebGL2RenderingContext)) return false;
  if (!gl.getExtension('EXT_color_buffer_float')) return false;
  // without parallel shader compile the tracer's large shader compiles synchronously and can freeze the tab
  if (!gl.getExtension('KHR_parallel_shader_compile')) return false;
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const name = String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
  return !/SwiftShader|llvmpipe|softpipe|software|Basic Render|Microsoft Basic/i.test(name);
}
