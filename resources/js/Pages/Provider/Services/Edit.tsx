import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Category {
    id: number;
    name: string;
}

interface PriceType {
    value: string;
    label: string;
}

interface GalleryImage {
    id: number;
    url: string;
}

interface ServiceData {
    id: number;
    name: string;
    description: string;
    category_id: number;
    price_type: string;
    price_min: number;
    price_max: number | null;
    location: string | null;
    delivery_time: string | null;
    tags: string[];
    status: string;
    cover_url: string;
    gallery: GalleryImage[];
}

interface Props {
    service: ServiceData;
    categories: Category[];
    price_types: PriceType[];
}

export default function Edit({ service, categories, price_types }: Props) {
    const [coverPreview, setCoverPreview] = useState<string | null>(service.cover_url);
    const [newCover, setNewCover] = useState<File | null>(null);
    const [galleryPreviews, setGalleryPreviews] = useState<Array<{ id?: number; url: string; file?: File }>>(
        service.gallery.map((g) => ({ id: g.id, url: g.url }))
    );
    const [tagInput, setTagInput] = useState('');

    const { data, setData, post, processing, errors } = useForm<{
        _method: string;
        category_id: string;
        name: string;
        description: string;
        price_type: string;
        price_min: string;
        price_max: string;
        location: string;
        delivery_time: string;
        tags: string[];
        cover_image: File | null;
        gallery_images: File[];
        remove_gallery_ids: number[];
    }>({
        _method: 'PUT',
        category_id: String(service.category_id),
        name: service.name,
        description: service.description,
        price_type: service.price_type,
        price_min: String(service.price_min),
        price_max: service.price_max ? String(service.price_max) : '',
        location: service.location || '',
        delivery_time: service.delivery_time || '',
        tags: service.tags || [],
        cover_image: null,
        gallery_images: [],
        remove_gallery_ids: [],
    });

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewCover(file);
            setData('cover_image', file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const currentCount = galleryPreviews.length;
        const availableSlots = 5 - currentCount;
        const newFiles = files.slice(0, availableSlots);

        setData('gallery_images', [...data.gallery_images, ...newFiles]);
        setGalleryPreviews([
            ...galleryPreviews,
            ...newFiles.map((file) => ({ url: URL.createObjectURL(file), file })),
        ]);
    };

    const removeGalleryImage = (index: number) => {
        const item = galleryPreviews[index];

        // If it's an existing image, add to remove list
        if (item.id) {
            setData('remove_gallery_ids', [...data.remove_gallery_ids, item.id]);
        } else if (item.file) {
            // If it's a new file, remove from gallery_images
            const newGallery = data.gallery_images.filter((f) => f !== item.file);
            setData('gallery_images', newGallery);
        }

        const newPreviews = [...galleryPreviews];
        newPreviews.splice(index, 1);
        setGalleryPreviews(newPreviews);
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !data.tags.includes(tag) && data.tags.length < 10) {
            setData('tags', [...data.tags, tag]);
            setTagInput('');
        }
    };

    const removeTag = (index: number) => {
        const newTags = [...data.tags];
        newTags.splice(index, 1);
        setData('tags', newTags);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('provider.services.update', service.id), {
            forceFormData: true,
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Pendente</span>;
            case 'published':
                return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Publicado</span>;
            case 'suspended':
                return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Suspenso</span>;
            case 'featured':
                return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">Destaque</span>;
            default:
                return null;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Editar Serviço
                    </h2>
                    {getStatusBadge(service.status)}
                </div>
            }
        >
            <Head title="Editar Serviço" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6">
                                    Informações Básicas
                                </h3>

                                <div className="space-y-6">
                                    <div>
                                        <InputLabel htmlFor="name" value="Nome do Serviço" />
                                        <TextInput
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="mt-1 block w-full"
                                            required
                                        />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="category_id" value="Categoria" />
                                        <select
                                            id="category_id"
                                            value={data.category_id}
                                            onChange={(e) => setData('category_id', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="">Seleccione uma categoria</option>
                                            {categories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.category_id} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="description" value="Descrição" />
                                        <textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            rows={5}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                        <InputError message={errors.description} className="mt-2" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6">
                                    Preço
                                </h3>

                                <div className="space-y-6">
                                    <div>
                                        <InputLabel htmlFor="price_type" value="Tipo de Preço" />
                                        <select
                                            id="price_type"
                                            value={data.price_type}
                                            onChange={(e) => setData('price_type', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            {price_types.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.price_type} className="mt-2" />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="price_min" value={data.price_type === 'variable' ? 'Preco Minimo (Kz)' : 'Preco (Kz)'} />
                                            <TextInput
                                                id="price_min"
                                                type="number"
                                                step="1"
                                                min="0"
                                                value={data.price_min}
                                                onChange={(e) => setData('price_min', e.target.value)}
                                                className="mt-1 block w-full"
                                                placeholder="Ex: 5000"
                                                required
                                            />
                                            <InputError message={errors.price_min} className="mt-2" />
                                            <p className="mt-1 text-xs text-gray-500">Valor em Kwanzas (Kz)</p>
                                        </div>

                                        {data.price_type === 'variable' && (
                                            <div>
                                                <InputLabel htmlFor="price_max" value="Preco Maximo (Kz)" />
                                                <TextInput
                                                    id="price_max"
                                                    type="number"
                                                    step="1"
                                                    min="0"
                                                    value={data.price_max}
                                                    onChange={(e) => setData('price_max', e.target.value)}
                                                    className="mt-1 block w-full"
                                                    placeholder="Ex: 10000"
                                                />
                                                <InputError message={errors.price_max} className="mt-2" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6">
                                    Informações Adicionais
                                </h3>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="location" value="Provincia / Cidade" />
                                            <select
                                                id="location"
                                                value={data.location}
                                                onChange={(e) => setData('location', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                <option value="">Seleccione uma localizacao</option>
                                                <optgroup label="Luanda">
                                                    <option value="Luanda">Luanda</option>
                                                    <option value="Luanda - Belas">Luanda - Belas</option>
                                                    <option value="Luanda - Cacuaco">Luanda - Cacuaco</option>
                                                    <option value="Luanda - Cazenga">Luanda - Cazenga</option>
                                                    <option value="Luanda - Viana">Luanda - Viana</option>
                                                    <option value="Luanda - Talatona">Luanda - Talatona</option>
                                                    <option value="Luanda - Kilamba">Luanda - Kilamba</option>
                                                </optgroup>
                                                <optgroup label="Outras Provincias">
                                                    <option value="Benguela">Benguela</option>
                                                    <option value="Lobito">Lobito</option>
                                                    <option value="Huambo">Huambo</option>
                                                    <option value="Cabinda">Cabinda</option>
                                                    <option value="Lubango">Lubango</option>
                                                    <option value="Malanje">Malanje</option>
                                                    <option value="Namibe">Namibe</option>
                                                    <option value="Soyo">Soyo</option>
                                                    <option value="Uige">Uige</option>
                                                    <option value="Mbanza Congo">Mbanza Congo</option>
                                                    <option value="Sumbe">Sumbe</option>
                                                    <option value="Ondjiva">Ondjiva</option>
                                                    <option value="Menongue">Menongue</option>
                                                    <option value="Saurimo">Saurimo</option>
                                                    <option value="Luena">Luena</option>
                                                    <option value="Dundo">Dundo</option>
                                                    <option value="N'Dalatando">N'Dalatando</option>
                                                </optgroup>
                                                <optgroup label="Servico Online">
                                                    <option value="Todo Angola">Todo Angola (Nacional)</option>
                                                    <option value="Online / Remoto">Online / Remoto</option>
                                                </optgroup>
                                            </select>
                                            <InputError message={errors.location} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="delivery_time" value="Tempo de Entrega (opcional)" />
                                            <TextInput
                                                id="delivery_time"
                                                value={data.delivery_time}
                                                onChange={(e) => setData('delivery_time', e.target.value)}
                                                className="mt-1 block w-full"
                                                placeholder="Ex: 2-3 dias, 1 semana..."
                                            />
                                            <InputError message={errors.delivery_time} className="mt-2" />
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <InputLabel htmlFor="tags" value="Tags (opcional)" />
                                        <div className="mt-1 flex rounded-md shadow-sm">
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addTag();
                                                    }
                                                }}
                                                className="block w-full rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                                placeholder="Adicione uma tag e pressione Enter"
                                            />
                                            <button
                                                type="button"
                                                onClick={addTag}
                                                className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 hover:bg-gray-100"
                                            >
                                                Adicionar
                                            </button>
                                        </div>
                                        {data.tags.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {data.tags.map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center rounded-full bg-indigo-100 py-0.5 pl-2.5 pr-1 text-sm font-medium text-indigo-700"
                                                    >
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTag(index)}
                                                            className="ml-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                                                        >
                                                            <span className="sr-only">Remover</span>
                                                            <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                                                <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                                                            </svg>
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">
                                            Máximo 10 tags
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Images */}
                        <div className="bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6">
                                    Imagens
                                </h3>

                                <div className="space-y-6">
                                    {/* Cover Image */}
                                    <div>
                                        <InputLabel htmlFor="cover_image" value="Imagem de Capa" />
                                        <div className="mt-1">
                                            {coverPreview ? (
                                                <div className="relative inline-block">
                                                    <img
                                                        src={coverPreview}
                                                        alt="Cover preview"
                                                        className="h-48 w-auto rounded-lg object-cover"
                                                    />
                                                    <label className="absolute bottom-2 right-2 cursor-pointer rounded-full bg-white p-2 shadow-md hover:bg-gray-100">
                                                        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                        <input
                                                            type="file"
                                                            accept="image/jpeg,image/png"
                                                            onChange={handleCoverChange}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                            ) : (
                                                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 hover:border-gray-400">
                                                    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="mt-2 text-sm text-gray-600">
                                                        Clique para seleccionar a imagem de capa
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png"
                                                        onChange={handleCoverChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                            )}
                                        </div>
                                        <InputError message={errors.cover_image} className="mt-2" />
                                    </div>

                                    {/* Gallery Images */}
                                    <div>
                                        <InputLabel htmlFor="gallery_images" value="Galeria (opcional)" />
                                        <div className="mt-1 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                                            {galleryPreviews.map((preview, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={preview.url}
                                                        alt={`Gallery ${index + 1}`}
                                                        className="h-24 w-full rounded-lg object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeGalleryImage(index)}
                                                        className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                                    >
                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                            {galleryPreviews.length < 5 && (
                                                <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400">
                                                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png"
                                                        multiple
                                                        onChange={handleGalleryChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Máximo 5 imagens (JPG, PNG, máx. 5MB cada)
                                        </p>
                                        <InputError message={errors.gallery_images} className="mt-2" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-4">
                            <Link
                                href={route('provider.services.index')}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                Cancelar
                            </Link>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'A guardar...' : 'Guardar Alterações'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
