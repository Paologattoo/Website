// Analisi locale dei frame con Apple Vision (gratis, sul Mac, nessun token).
// Uso: swift vision.swift frame1.jpg frame2.jpg ...   (oppure compilato: ./vision ...)
// Stampa un JSON: per ogni frame volti, persone e testo a schermo.
// I riquadri sono normalizzati 0-1 con origine in alto a sinistra: [x, y, larghezza, altezza].
import Foundation
import ImageIO
import Vision

func carica(_ percorso: String) -> CGImage? {
    guard let sorgente = CGImageSourceCreateWithURL(URL(fileURLWithPath: percorso) as CFURL, nil) else { return nil }
    return CGImageSourceCreateImageAtIndex(sorgente, 0, nil)
}

// Vision usa l'origine in basso a sinistra: la porto in alto a sinistra
func riquadro(_ r: CGRect) -> [Double] {
    [r.minX, 1 - r.maxY, r.width, r.height].map { (Double($0) * 1000).rounded() / 1000 }
}

var risultati: [[String: Any]] = []
for percorso in CommandLine.arguments.dropFirst() {
    guard let immagine = carica(percorso) else { continue }
    let volti = VNDetectFaceRectanglesRequest()
    let persone = VNDetectHumanRectanglesRequest()
    let testo = VNRecognizeTextRequest()
    testo.recognitionLevel = .accurate
    testo.recognitionLanguages = ["it-IT", "en-US"]
    testo.usesLanguageCorrection = true
    try? VNImageRequestHandler(cgImage: immagine, options: [:]).perform([volti, persone, testo])

    risultati.append([
        "file": (percorso as NSString).lastPathComponent,
        "volti": (volti.results ?? []).map { riquadro($0.boundingBox) },
        "persone": (persone.results ?? []).count,
        "testo": (testo.results ?? []).compactMap { o -> [String: Any]? in
            guard let c = o.topCandidates(1).first, c.confidence >= 0.4 else { return nil }
            return ["t": c.string, "box": riquadro(o.boundingBox)]
        },
    ])
}
let dati = try JSONSerialization.data(withJSONObject: risultati, options: [])
FileHandle.standardOutput.write(dati)
