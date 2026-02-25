const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_WIDTH = 1024
const MAX_HEIGHT = 768
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg']

export const validateImage = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 1. type
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject('Format gambar harus JPG / JPEG / PNG')
      return
    }

    // 2. size
    if (file.size > MAX_SIZE) {
      reject('Ukuran gambar maksimal 5MB')
      return
    }

    // 3. resolution
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      if (img.width > MAX_WIDTH || img.height > MAX_HEIGHT) {
        reject(`Resolusi maksimal ${MAX_WIDTH}x${MAX_HEIGHT}px`)
      } else {
        resolve()
      }
    }

    img.onerror = () => {
      reject('File gambar tidak valid')
    }

    img.src = url
  })
}

