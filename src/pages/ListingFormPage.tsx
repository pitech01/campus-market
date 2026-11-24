import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  X,
  Camera,
  Check,
  MapPin,
} from 'lucide-react'
import {
  createListing,
  updateListing,
  getListing,
  getCategories,
  getMeetingLocations,
  resolveImageUrl,
} from '../lib/api'
import { useAuth } from '../lib/authContext'
import type { Category, MeetingLocation, ItemCondition, ListingType } from '../types'

const CONDITIONS: ItemCondition[] = ['Brand New', 'Like New', 'Good Condition', 'Fair']

export default function ListingFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const isEdit = Boolean(id)

  const [categoriesList, setCategoriesList] = useState<Category[]>([])
  const [meetingLocations, setMeetingLocations] = useState<MeetingLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    categoryId: 1,
    listingType: 'sell' as ListingType,
    condition: 'Good Condition' as ItemCondition,
    price: '',
    quantity: '1',
    exchangeWanted: '',
    meetingLocationId: 1,
    description: '',
  })

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  useEffect(() => {
    // Load categories & meeting locations
    Promise.all([getCategories(), getMeetingLocations()])
      .then(([cats, locs]) => {
        setCategoriesList(cats)
        setMeetingLocations(locs)
        if (cats.length > 0 && !isEdit) {
          setForm((prev) => ({ ...prev, categoryId: Number(cats[0].id) }))
        }
        if (locs.length > 0 && !isEdit) {
          setForm((prev) => ({ ...prev, meetingLocationId: locs[0].id }))
        }
      })
      .catch(() => {})

    if (isEdit && id) {
      setIsLoading(true)
      getListing(id)
        .then((data) => {
          setForm({
            title: data.title,
            categoryId: data.category?.id ? Number(data.category.id) : 1,
            listingType: (data.listing_type as ListingType) || 'sell',
            condition: (data.condition as ItemCondition) || 'Good Condition',
            price: String(data.price),
            quantity: String(data.quantity || 1),
            exchangeWanted: data.exchange_wanted || '',
            meetingLocationId: data.meeting_location?.id || 1,
            description: data.description,
          })
          if (Array.isArray(data.images) && data.images.length > 0) {
            setPreviewUrls(
              data.images.map((img: any) => resolveImageUrl(typeof img === 'string' ? img : img.url))
            )
          }
        })
        .catch(() => setErrorMessage('Failed to load listing for editing.'))
        .finally(() => setIsLoading(false))
    }
  }, [id, isEdit])

  const handleImageFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      const combined = [...imageFiles, ...filesArray].slice(0, 6)
      setImageFiles(combined)

      const newPreviews = combined.map((file) => URL.createObjectURL(file))
      setPreviewUrls(newPreviews)
    }
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage(null)

    if (!form.title.trim() || !form.description.trim()) {
      setErrorMessage('Please provide a title and description.')
      return
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('category_id', String(form.categoryId))
      formData.append('listing_type', form.listingType)
      formData.append('condition', form.condition)
      formData.append('price', String(form.price || '0'))
      formData.append('quantity', String(form.quantity || '1'))
      if (form.exchangeWanted) formData.append('exchange_wanted', form.exchangeWanted)
      if (form.meetingLocationId) formData.append('meeting_location_id', String(form.meetingLocationId))
      formData.append('description', form.description)

      imageFiles.forEach((file) => {
        formData.append('images[]', file)
      })

      if (isEdit && id) {
        await updateListing(id, formData)
        navigate(`/listings/${id}`)
      } else {
        const created = await createListing(formData)
        navigate(`/listings/${created.id}`)
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save listing. Please check required fields.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-800 rounded-2xl border text-center">
        <h2 className="text-xl font-bold mb-2">Sign in to Post an Item</h2>
        <p className="text-xs text-slate-500 mb-6">
          Only verified Nasarawa State University Keffi (NSUK) students can post items for sale or exchange.
        </p>
        <Link
          to="/login"
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm inline-block"
        >
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <section className="form-page">
      <div className="form-container">
        <Link to="/" className="back-link mb-4 inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4 back-icon" />
          <span>Back to marketplace</span>
        </Link>

        <div className="form-layout-card">
          <div className="form-header-area">
            <span className="form-eyebrow">
              {isEdit ? 'Update Listing' : 'Student Marketplace (NSUK)'}
            </span>
            <h1>{isEdit ? 'Edit listing details' : 'Post an Item for Sale or Exchange'}</h1>
            <p className="form-subtext">
              Reach 300+ students on campus. Upload clear photos, pick a safe campus meetup spot, and connect directly!
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading listing details...</div>
          ) : (
            <form onSubmit={handleSubmit} className="marketplace-form">
              {/* Photo Upload & Multi-preview (1 to 6 photos) */}
              <div className="form-group">
                <label className="field-label">
                  <span>Product Photos ({previewUrls.length}/6)</span>
                  <span className="field-hint">Upload 1 to 6 clean photos (JPG, PNG, WebP)</span>
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                      <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-90 hover:opacity-100 transition shadow"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {previewUrls.length < 6 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center cursor-pointer transition text-slate-400 hover:text-emerald-600">
                      <Camera className="w-6 h-6 mb-1 text-slate-400" />
                      <span className="text-[10px] font-bold">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageFilesChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="form-group">
                <label className="field-label">
                  <span>Listing Title</span>
                  <span className="field-hint">e.g. Operating Systems Concepts (10th Ed) or Logitech Wireless Mouse</span>
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="What are you offering?"
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Listing Type & Condition */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="field-label">Listing Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['sell', 'exchange', 'both'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, listingType: type }))}
                        className={`py-2 text-xs font-bold rounded-xl border uppercase transition ${
                          form.listingType === type
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="field-label">Item Condition</label>
                  <div className="condition-select-pills">
                    {CONDITIONS.map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        className={`cond-choice-pill ${form.condition === cond ? 'is-selected' : ''}`}
                        onClick={() => setForm((prev) => ({ ...prev, condition: cond }))}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category & Quantity */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="field-label">Campus Category</label>
                  <select
                    className="input-control select-control"
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm((prev) => ({ ...prev, categoryId: Number(e.target.value) }))}
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name || cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label">Quantity Available</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    className="input-control"
                    value={form.quantity}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
              </div>

              {/* Price & Exchange Terms */}
              <div className="form-row-2">
                {form.listingType !== 'exchange' && (
                  <div className="form-group">
                    <label className="field-label">
                      <span>Asking Price (NGN)</span>
                      <span className="field-hint">Nigerian Naira (₦)</span>
                    </label>
                    <div className="input-with-affix">
                      <span className="input-prefix">₦</span>
                      <input
                        type="number"
                        className="input-control with-prefix"
                        min={0}
                        step="1"
                        placeholder="15000"
                        required={form.listingType === 'sell'}
                        value={form.price}
                        onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {form.listingType !== 'sell' && (
                  <div className="form-group flex-1">
                    <label className="field-label">
                      <span>Exchange Wanted</span>
                      <span className="field-hint">What would you accept in swap?</span>
                    </label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="e.g. Database Systems 3rd Ed or USB-C Hub"
                      value={form.exchangeWanted}
                      onChange={(e) => setForm((prev) => ({ ...prev, exchangeWanted: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              {/* Safe Meetup Spot Selection */}
              <div className="form-group">
                <label className="field-label flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Preferred Safe Campus Meet-up Spot</span>
                  <span className="field-hint">Public, well-lit NSUK campus areas</span>
                </label>
                <select
                  className="input-control select-control"
                  value={form.meetingLocationId}
                  onChange={(e) => setForm((prev) => ({ ...prev, meetingLocationId: Number(e.target.value) }))}
                >
                  {meetingLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.description ? `(${loc.description})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="field-label">
                  <span>Description & Item Notes</span>
                  <span className="field-hint">Mention inclusions, course codes, or condition details</span>
                </label>
                <textarea
                  className="input-control textarea-control"
                  rows={4}
                  placeholder="e.g. Clean pages with pencil notes in chapters 1-3. Bought last semester for BIT204. No missing pages."
                  required
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="form-submit-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg submit-listing-btn inline-flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Publishing...'
                      : isEdit
                      ? 'Save Listing Changes'
                      : 'Publish to NSUK Marketplace'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

