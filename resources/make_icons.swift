// Builds the app icons from piggi2.png. Run from the repo root: swift resources/make_icons.swift
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let sourceURL = URL(fileURLWithPath: "resources/piggi2.png")
let resourcesDir = URL(fileURLWithPath: "resources")
let publicDir = URL(fileURLWithPath: "web/public")
guard FileManager.default.fileExists(atPath: sourceURL.path) else { fatalError("Run from the repo root.") }

let cream = CGColor(srgbRed: 0xfe / 255, green: 0xfa / 255, blue: 0xe0 / 255, alpha: 1)
let forest = CGColor(srgbRed: 0x28 / 255, green: 0x36 / 255, blue: 0x18 / 255, alpha: 1)
let srgb = CGColorSpace(name: CGColorSpace.sRGB)!

guard let src = CGImageSourceCreateWithURL(sourceURL as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(src, 0, nil) else { fatalError("cannot read source") }

// Find the drawing's bounding box from the alpha channel.
let w = image.width, h = image.height
var pixels = [UInt8](repeating: 0, count: w * h * 4)
let readCtx = CGContext(data: &pixels, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                        space: srgb, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
readCtx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
var minX = w, minY = h, maxX = 0, maxY = 0
for y in 0..<h { for x in 0..<w where pixels[(y * w + x) * 4 + 3] > 8 {
  minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
} }
// Bitmap rows start at the top; CG crop uses the same top-left origin.
let bbox = CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1)
let cropped = image.cropping(to: bbox)!
print("drawing bbox in source:", bbox)

// Recolor: keep the alpha, paint every visible pixel forest green.
func recolored(_ img: CGImage) -> CGImage {
  let ctx = CGContext(data: nil, width: img.width, height: img.height, bitsPerComponent: 8, bytesPerRow: 0,
                      space: srgb, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  let rect = CGRect(x: 0, y: 0, width: img.width, height: img.height)
  ctx.draw(img, in: rect)
  ctx.setBlendMode(.sourceIn)
  ctx.setFillColor(forest)
  ctx.fill(rect)
  return ctx.makeImage()!
}
let art = recolored(cropped)

/// `fill`: share of the canvas the drawing's longer side takes. `corner`: radius as a share of size, 0 for square.
func render(size: Int, fill: CGFloat, corner: CGFloat, opaque: Bool, to url: URL) {
  let info = opaque ? CGImageAlphaInfo.noneSkipLast.rawValue : CGImageAlphaInfo.premultipliedLast.rawValue
  let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
                      space: srgb, bitmapInfo: info)!
  ctx.interpolationQuality = .high
  let canvas = CGRect(x: 0, y: 0, width: size, height: size)
  if corner > 0 {
    let r = CGFloat(size) * corner
    ctx.addPath(CGPath(roundedRect: canvas, cornerWidth: r, cornerHeight: r, transform: nil))
    ctx.clip()
  }
  ctx.setFillColor(cream)
  ctx.fill(canvas)

  let scale = CGFloat(size) * fill / CGFloat(max(art.width, art.height))
  let dw = CGFloat(art.width) * scale, dh = CGFloat(art.height) * scale
  ctx.draw(art, in: CGRect(x: (CGFloat(size) - dw) / 2, y: (CGFloat(size) - dh) / 2, width: dw, height: dh))

  let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dest, ctx.makeImage()!, nil)
  guard CGImageDestinationFinalize(dest) else { fatalError("cannot write \(url.path)") }
  print("wrote", url.lastPathComponent, size)
}

// iOS: square and opaque, iOS applies the rounded mask itself.
render(size: 1024, fill: 0.68, corner: 0, opaque: true, to: resourcesDir.appendingPathComponent("icon-1024.png"))
// Home Screen icon for Safari: square and opaque as well.
render(size: 180, fill: 0.70, corner: 0, opaque: true, to: publicDir.appendingPathComponent("apple-touch-icon.png"))
// Browser tab: rounded cream tile, drawing larger so it reads at 16 to 32 px.
render(size: 64, fill: 0.80, corner: 0.22, opaque: false, to: publicDir.appendingPathComponent("favicon.png"))
