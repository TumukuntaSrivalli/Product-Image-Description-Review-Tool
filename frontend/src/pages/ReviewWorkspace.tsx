import { useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  approveReview,
  fetchImages,
  flagReview,
  generateDrafts,
  resetReview,
  updateReview,
} from '../lib/api'
import { useReviewStore } from '../store/useReviewStore'
import { AmazonNavbar } from '../components/navigation/AmazonNavbar'
import { AmazonSubnav } from '../components/navigation/AmazonSubnav'
import { Filmstrip } from '../components/workspace/Filmstrip'
import { ImageViewer } from '../components/workspace/ImageViewer'
import { EditorPanel } from '../components/workspace/EditorPanel'
import { CommandPalette } from '../components/common/CommandPalette'
import { ShortcutsModal } from '../components/common/ShortcutsModal'
import { SiteFooter } from '../components/common/SiteFooter'
import type { ImageRecord, ReviewSavePayload } from '../types'

export function ReviewWorkspace() {
  const queryClient = useQueryClient()
  const {
    selectedProductId,
    setSelectedProductId,
    activeFilter,
    searchQuery,
    isOffline,
    setIsOffline,
    toggleTheme,
    setShowShortcutsModal,
  } = useReviewStore()

  // Fetch images query
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['images'],
    queryFn: fetchImages,
    retry: 2,
  })

  // Handle offline detection
  useEffect(() => {
    if (isError) {
      setIsOffline(true)
    } else {
      setIsOffline(false)
    }
  }, [isError, setIsOffline])

  const images: ImageRecord[] = data?.images || []

  // Ensure selectedProductId is valid
  useEffect(() => {
    if (images.length > 0 && !images.some((img) => img.product_id === selectedProductId)) {
      setSelectedProductId(images[0].product_id)
    }
  }, [images, selectedProductId, setSelectedProductId])

  // Current selected image
  const currentImage = useMemo(() => {
    return images.find((img) => img.product_id === selectedProductId) || images[0]
  }, [images, selectedProductId])

  // Filtered images based on active queue filter and search
  const filteredImages = useMemo(() => {
    let result = images
    if (activeFilter === 'needs_review') {
      result = result.filter((img) => img.status === 'draft' || img.status === 'edited' || img.status === 'needs_re_review')
    } else if (activeFilter === 'approved') {
      result = result.filter((img) => img.status === 'approved')
    } else if (activeFilter === 'flagged') {
      result = result.filter((img) => img.status === 'flagged_inaccessible')
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (img) =>
          img.product_id.toLowerCase().includes(q) ||
          (img.metadata_title && img.metadata_title.toLowerCase().includes(q)) ||
          img.visible_description.toLowerCase().includes(q)
      )
    }
    return result
  }, [images, activeFilter, searchQuery])

  // Counts for subnav
  const counts = useMemo(() => {
    const all = images.length
    const approved = images.filter((img) => img.status === 'approved').length
    const flagged = images.filter((img) => img.status === 'flagged_inaccessible').length
    const needsReview = all - approved - flagged
    return { all, needsReview, approved, flagged }
  }, [images])

  // Dynamic document title
  useEffect(() => {
    document.title = `${counts.approved}/10 approved — VarnX`
  }, [counts.approved])

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: ReviewSavePayload }) =>
      updateReview(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error saving description')
    },
  })

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (productId: string) => approveReview(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['images'] })
      toast.success(`Product ${productId} approved!`, {
        action: {
          label: 'Undo',
          onClick: () => resetMutation.mutate(productId),
        },
      })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Validation failed; cannot approve')
    },
  })

  // Flag Mutation
  const flagMutation = useMutation({
    mutationFn: ({ productId, reason }: { productId: string; reason: string }) =>
      flagReview(productId, reason),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['images'] })
      toast.warning(`Product ${productId} flagged as inaccessible.`)
    },
    onError: () => {
      toast.error('Failed to flag image')
    },
  })

  // Reset Mutation
  const resetMutation = useMutation({
    mutationFn: (productId: string) => resetReview(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['images'] })
      toast.info(`Product ${productId} reset to draft.`)
    },
    onError: () => {
      toast.error('Failed to reset')
    },
  })

  // Generate Drafts Mutation
  const generateDraftsMutation = useMutation({
    mutationFn: (productId?: string) => generateDrafts(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['images'] })
      if (productId && productId !== 'all') {
        toast.success(`Draft regenerated for ${productId}`)
      } else {
        toast.success('Generated drafts for all 10 products')
      }
    },
    onError: () => {
      toast.error('Failed to generate drafts')
    },
  })

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA'

      // Shortcuts that work even in input
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (currentImage) {
          saveMutation.mutate({
            productId: currentImage.product_id,
            payload: {
              edited_text: currentImage.edited_text,
              page_context: currentImage.page_context,
            },
          })
          toast.success(`Saved ${currentImage.product_id}`)
        }
        return
      }

      if (isInput) return

      if (e.key === 'j' || e.key === 'J') {
        // Next product
        const currentIndex = images.findIndex((img) => img.product_id === selectedProductId)
        if (currentIndex < images.length - 1) {
          setSelectedProductId(images[currentIndex + 1].product_id)
        }
      } else if (e.key === 'k' || e.key === 'K') {
        // Previous product
        const currentIndex = images.findIndex((img) => img.product_id === selectedProductId)
        if (currentIndex > 0) {
          setSelectedProductId(images[currentIndex - 1].product_id)
        }
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        document.getElementById('editor-alt-textarea')?.focus()
      } else if (e.key === 'a' || e.key === 'A') {
        if (currentImage) {
          approveMutation.mutate(currentImage.product_id)
        }
      } else if (e.key === 'g' || e.key === 'G') {
        if (currentImage) {
          generateDraftsMutation.mutate(currentImage.product_id)
        }
      } else if (e.key === 't' || e.key === 'T') {
        toggleTheme()
      } else if (e.key === '?') {
        setShowShortcutsModal(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [images, selectedProductId, currentImage, setSelectedProductId, approveMutation, generateDraftsMutation, saveMutation, toggleTheme, setShowShortcutsModal])

  return (
    <div className="app-container">
      <AmazonNavbar reviewedCount={counts.approved} totalCount={counts.all} />
      <AmazonSubnav
        counts={counts}
        onGenerateAllDrafts={() => generateDraftsMutation.mutate('all')}
        isGenerating={generateDraftsMutation.isPending}
      />

      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="offline-banner" role="alert">
          ⚠️ Backend API connection offline. Retrying... changes will sync once connection is restored.
        </div>
      )}

      <main className="page-shell workspace-page" id="main-content">
        {/* Status / Announcement Bar */}
        <div className="workspace-status-banner">
          <div>
            <span style={{ fontWeight: 800, fontSize: '0.94rem' }}>
              Amazon Catalog Ergonomics Review Studio
            </span>
            <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
            <span style={{ fontSize: '0.84rem', color: '#DDD' }}>
              Reviewing: <strong>{currentImage?.product_id}</strong> ({currentImage?.metadata_title || 'Illustration'})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem' }}>
            <span>Status: <strong style={{ color: 'var(--amazon-gold)', textTransform: 'capitalize' }}>{currentImage?.status.replace('_', ' ')}</strong></span>
            <span>Uncertainty flags: <strong>{currentImage?.flags.length || 0}</strong></span>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            Loading catalogue images...
          </div>
        ) : !currentImage ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            No products matching the active filter.
          </div>
        ) : (
          <div className="workspace-grid">
            {/* Left Filmstrip */}
            <Filmstrip
              images={filteredImages}
              selectedId={selectedProductId}
              onSelect={setSelectedProductId}
            />

            {/* Center Image Inspection Viewer */}
            <ImageViewer image={currentImage} />

            {/* Right Editor Panel */}
            <EditorPanel
              key={currentImage.product_id}
              image={currentImage}
              onSave={(payload) => saveMutation.mutate({ productId: currentImage.product_id, payload })}
              onApprove={() => approveMutation.mutate(currentImage.product_id)}
              onFlag={(reason) => flagMutation.mutate({ productId: currentImage.product_id, reason })}
              onReset={() => resetMutation.mutate(currentImage.product_id)}
              onGenerateDraft={() => generateDraftsMutation.mutate(currentImage.product_id)}
              isSaving={saveMutation.isPending}
              isApproving={approveMutation.isPending}
            />
          </div>
        )}
      </main>

      {/* Global Command Palette & Shortcuts Modal */}
      <CommandPalette
        products={images}
        onGenerateAll={() => generateDraftsMutation.mutate('all')}
      />
      <ShortcutsModal />

      <SiteFooter />
    </div>
  )
}
