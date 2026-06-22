const CLOUDINARY_CLOUD_NAME = 'your_cloud_name'
const CLOUDINARY_UPLOAD_PRESET = 'chatapp_uploads'

export async function uploadToCloudinary(uri: string, type: 'image' | 'video' | 'audio') {
    try {
        const formData = new FormData()
        const CLOUDINARY_CLOUD_NAME = 'dcfhokfhl'
        const filename = uri.split('/').pop() || 'file'
        const mimeType = type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'audio/m4a'
        
        formData.append('file', {
            uri,
            type: mimeType,
            name: filename
        } as any)
        
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
        formData.append('resource_type', type === 'audio' ? 'video' : type)

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${type === 'audio' ? 'video' : type}/upload`,
            {
                method: 'POST',
                body: formData
            }
        )

        const data = await response.json()
        return data.secure_url
    } catch (error) {
        console.log('Cloudinary upload error:', error)
        return null
    }
}