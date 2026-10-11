import { Page } from '../components/Layout';
import { SectionHeading, Spinner } from '../components/ui';
import { useApi, useDocumentTitle } from '../lib/hooks';
import type { GallerySummary } from '../lib/types';
import { GalleryShowcase } from './Home';

export default function Galleries() {
  useDocumentTitle('Galleries');
  const { data, loading } = useApi<{ galleries: GallerySummary[] }>('/galleries');
  return (
    <Page className="pt-12">
      <SectionHeading eyebrow="Vendors" title="The galleries" />
      <p className="-mt-4 mb-12 max-w-2xl text-mute">Every gallery on Curated Art is reviewed by our specialists before its first work goes on view.</p>
      {loading ? <Spinner /> : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data?.galleries.map((g, i) => <GalleryShowcase key={g.id} gallery={g} index={i} />)}
        </div>
      )}
    </Page>
  );
}
