import { router } from '@inertiajs/react';
import { Autocomplete, Button } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { GRADIENT } from '@/theme';
import { routes } from '@/lib/routes';

interface Suggestion {
    name: string;
    slug: string;
    category: string | null;
}

/** Pesquisa com sugestões em tempo real (Axios → /servicos/sugestoes). */
export default function SearchBox({ hero = false, initial = '', placeholder = 'Pesquisar serviços…' }: {
    hero?: boolean;
    initial?: string;
    placeholder?: string;
}) {
    const [query, setQuery] = useState(initial);
    const [debounced] = useDebouncedValue(query, 250);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

    useEffect(() => {
        if (debounced.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        const controller = new AbortController();
        axios
            .get<Suggestion[]>(routes.suggestions, { params: { q: debounced }, signal: controller.signal })
            .then((res) => setSuggestions(res.data))
            .catch(() => undefined);

        return () => controller.abort();
    }, [debounced]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(routes.services, query.trim() ? { q: query.trim() } : {});
    };

    const pick = (name: string) => {
        const match = suggestions.find((s) => s.name === name);
        if (match) router.visit(routes.service(match.slug));
    };

    return (
        <form
            onSubmit={submit}
            role="search"
            className={hero
                ? 'mx-auto flex max-w-[760px] flex-wrap items-center gap-2 rounded-[28px] bg-white p-2 pl-5 shadow-[0_20px_40px_-16px_rgba(0,0,0,.4)] sm:flex-nowrap sm:rounded-full'
                : 'flex max-w-[640px] flex-1 items-center'}
        >
            <Autocomplete
                className="min-w-0 flex-1"
                aria-label="Pesquisar serviços"
                placeholder={hero ? 'O que procura? Ex: Electricista, Canalizador…' : placeholder}
                value={query}
                onChange={setQuery}
                data={suggestions.map((s) => s.name)}
                filter={({ options }) => options}
                onOptionSubmit={pick}
                leftSection={<IconSearch size={hero ? 22 : 18} />}
                variant={hero ? 'unstyled' : 'filled'}
                radius="xl"
                size={hero ? 'lg' : 'sm'}
                comboboxProps={{ shadow: 'md' }}
            />
            {hero && (
                <Button type="submit" size="lg" radius="xl" variant="gradient" gradient={GRADIENT} className="w-full px-8 sm:w-auto">
                    Pesquisar
                </Button>
            )}
        </form>
    );
}
