interface UploadedUrls {
  video: {
    url: string;
    publicId: string;
    size: string;
    duration: string;
  };
  image1: {
    url: string;
    publicId: string;
    size: string;
  };
  image2: {
    url: string;
    publicId: string;
    size: string;
  };
  message: string;
}

interface SuccessResultProps {
  uploadedUrls: UploadedUrls | null;
}

export default function SuccessResult({ uploadedUrls }: SuccessResultProps) {
  if (!uploadedUrls) return null;

  return (
    <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
      <p className="font-bold text-green-800 mb-3 text-sm sm:text-base">🎉 File đã upload thành công!</p>
      
      <div className="space-y-3 text-xs sm:text-sm">
        <div>
          <p className="font-semibold text-gray-700 mb-1">🎥 Video ({uploadedUrls.video?.size}):</p>
          <a 
            href={uploadedUrls.video?.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {uploadedUrls.video?.url}
          </a>
        </div>
        
        <div>
          <p className="font-semibold text-gray-700 mb-1">📸 Ảnh 1 ({uploadedUrls.image1?.size}):</p>
          <a 
            href={uploadedUrls.image1?.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {uploadedUrls.image1?.url}
          </a>
        </div>
        
        <div>
          <p className="font-semibold text-gray-700 mb-1">📸 Ảnh 2 ({uploadedUrls.image2?.size}):</p>
          <a 
            href={uploadedUrls.image2?.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {uploadedUrls.image2?.url}
          </a>
        </div>
      </div>
    </div>
  );
}
