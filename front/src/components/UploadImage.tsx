// ============================================================
// COMPOSANT : UploadImage
// ============================================================
// Drag&drop + bouton "Parcourir" + apercu + barre de progression.
//
// Props :
// - categorie : "plats" | "menus" (cible le bon dossier back)
// - urlActuelle : URL de l'image deja stockee (affichee comme apercu initial)
// - onUploaded : callback(url) appele quand l'upload reussit
// - onSupprimee : callback() appele quand on retire l'image
//
// Upload via POST /api/upload/:categorie (champ form "image").
// Validation cote front : type (image/*), taille (5 Mo max).
// ============================================================

import { useState, useRef, useCallback } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react'
import './UploadImage.css'

interface Props {
    categorie: 'plats' | 'menus'
    urlActuelle?: string | null
    onUploaded: (url: string) => void
    onSupprimee?: () => void
}

const TAILLE_MAX_MO = 5
const TYPES_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp']

export default function UploadImage({
    categorie,
    urlActuelle,
    onUploaded,
    onSupprimee,
}: Props) {
    const [chargement, setChargement] = useState(false)
    const [erreur, setErreur] = useState<string | null>(null)
    const [survol, setSurvol] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)

    const upload = useCallback(
        async (fichier: File) => {
            setErreur(null)

            // Validation type
            if (!TYPES_ACCEPTES.includes(fichier.type)) {
                setErreur('Format non supporté. Acceptés : JPEG, PNG, WebP.')
                return
            }

            // Validation taille
            const tailleMo = fichier.size / 1024 / 1024
            if (tailleMo > TAILLE_MAX_MO) {
                setErreur(
                    `Image trop volumineuse (${tailleMo.toFixed(1)} Mo). Max : ${TAILLE_MAX_MO} Mo.`,
                )
                return
            }

            setChargement(true)
            try {
                // On recupere le token CSRF (notre api.ts gere le cache)
                // Comme on utilise fetch direct ici (multipart), on doit
                // recuperer le token manuellement.
                const respToken = await fetch('/api/csrf-token', {
                    credentials: 'include',
                })
                const { csrfToken } = await respToken.json()

                const formData = new FormData()
                formData.append('image', fichier)

                const reponse = await fetch(`/api/upload/${categorie}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'x-csrf-token': csrfToken,
                    },
                    body: formData,
                })

                if (!reponse.ok) {
                    const data = await reponse.json().catch(() => ({}))
                    throw new Error(data.erreur || 'Erreur lors de l’upload')
                }

                const data = await reponse.json()
                onUploaded(data.url)
            } catch (err: any) {
                setErreur(err.message || 'Erreur lors de l’upload')
            } finally {
                setChargement(false)
            }
        },
        [categorie, onUploaded],
    )

    function gererChangementInput(e: ChangeEvent<HTMLInputElement>) {
        const fichier = e.target.files?.[0]
        if (fichier) upload(fichier)
        // Reset l'input pour permettre de re-selectionner le meme fichier
        e.target.value = ''
    }

    function gererDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault()
        setSurvol(false)
        const fichier = e.dataTransfer.files?.[0]
        if (fichier) upload(fichier)
    }

    function gererDragOver(e: DragEvent<HTMLDivElement>) {
        e.preventDefault()
        setSurvol(true)
    }

    function gererDragLeave(e: DragEvent<HTMLDivElement>) {
        e.preventDefault()
        setSurvol(false)
    }

    function gererSuppression() {
        setErreur(null)
        if (onSupprimee) onSupprimee()
    }

    // Vue : aperçu si image deja presente, sinon zone de drop
    if (urlActuelle) {
        return (
            <div className="upload-image">
                <div className="upload-image-apercu">
                    <img src={urlActuelle} alt="Aperçu" />
                    <div className="upload-image-apercu-actions">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="upload-image-bouton-changer"
                            disabled={chargement}
                            title="Changer l'image"
                        >
                            <Upload size={14} />
                            Changer
                        </button>
                        {onSupprimee && (
                            <button
                                type="button"
                                onClick={gererSuppression}
                                className="upload-image-bouton-supprimer"
                                disabled={chargement}
                                title="Retirer l'image"
                                aria-label="Retirer l'image"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    {chargement && (
                        <div className="upload-image-overlay">
                            <Loader size={28} className="upload-image-spinner" />
                        </div>
                    )}
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept={TYPES_ACCEPTES.join(',')}
                    onChange={gererChangementInput}
                    style={{ display: 'none' }}
                />
                {erreur && (
                    <div className="upload-image-erreur" role="alert">
                        {erreur}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="upload-image">
            <div
                className={`upload-image-zone ${survol ? 'upload-image-zone--survol' : ''} ${chargement ? 'upload-image-zone--chargement' : ''}`}
                onDrop={gererDrop}
                onDragOver={gererDragOver}
                onDragLeave={gererDragLeave}
                onClick={() => !chargement && inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !chargement) {
                        inputRef.current?.click()
                    }
                }}
                aria-label="Cliquez ou déposez une image"
            >
                {chargement ? (
                    <>
                        <Loader size={32} className="upload-image-spinner" />
                        <strong>Upload en cours…</strong>
                    </>
                ) : (
                    <>
                        <div className="upload-image-icone">
                            <ImageIcon size={28} />
                        </div>
                        <strong>Glissez une image ici</strong>
                        <span className="upload-image-aide">
                            ou cliquez pour parcourir
                        </span>
                        <span className="upload-image-formats">
                            JPEG, PNG, WebP · max {TAILLE_MAX_MO} Mo
                        </span>
                    </>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept={TYPES_ACCEPTES.join(',')}
                onChange={gererChangementInput}
                style={{ display: 'none' }}
            />
            {erreur && (
                <div className="upload-image-erreur" role="alert">
                    {erreur}
                </div>
            )}
        </div>
    )
}
