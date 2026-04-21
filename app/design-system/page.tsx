'use client'

import Link from 'next/link'

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-12 border-b border-white/10 pb-8">
          <h1 className="text-4xl font-bold mb-2">Design System</h1>
          <p className="text-white/60">Kids YouTube Studio — Visual Language & Components</p>
          <Link href="/" className="btn-ghost mt-4 inline-block text-sm">← Back to App</Link>
        </div>

        {/* Color Palette */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-white/90">Color Palette</h2>
          
          <div className="mb-6">
            <h3 className="text-sm text-white/50 mb-3 uppercase tracking-wider">Base Colors</h3>
            <div className="flex gap-4 flex-wrap">
              <ColorSwatch name="Background" color="#09090B" textColor="white" />
              <ColorSwatch name="Surface" color="#18181B" textColor="white" />
              <ColorSwatch name="Border" color="rgba(255,255,255,0.1)" textColor="white" />
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm text-white/50 mb-3 uppercase tracking-wider">Accent Colors</h3>
            <div className="flex gap-4 flex-wrap">
              <ColorSwatch name="Indigo" color="#6366F1" textColor="white" />
              <ColorSwatch name="Amber" color="#F59E0B" textColor="black" />
              <ColorSwatch name="Rose" color="#FB7185" textColor="white" />
              <ColorSwatch name="Sky" color="#38BDF8" textColor="black" />
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-white/90">Typography</h2>
          
          <div className="space-y-8">
            <div>
              <p className="text-xs text-white/40 mb-1 font-mono">heading-1</p>
              <h1 className="heading-1">The quick brown fox jumps</h1>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1 font-mono">heading-2</p>
              <h2 className="heading-2">The quick brown fox jumps over the lazy dog</h2>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1 font-mono">heading-3</p>
              <h3 className="heading-3">The quick brown fox jumps over the lazy dog</h3>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1 font-mono">label</p>
              <div className="label">Label Text — Used for metadata and captions</div>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1 font-mono">Body Text</p>
              <p className="text-base text-white/80 leading-relaxed max-w-prose">
                The quick brown fox jumps over the lazy dog. This is body text used for longer passages. 
                It should be comfortable to read and have appropriate line-height for the dark theme.
              </p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-white/90">Buttons</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <ButtonShowcase name="btn-primary" className="btn-primary">
              Primary Action
            </ButtonShowcase>
            <ButtonShowcase name="btn-secondary" className="btn-secondary">
              Secondary Action
            </ButtonShowcase>
            <ButtonShowcase name="btn-ghost" className="btn-ghost">
              Ghost Button
            </ButtonShowcase>
            <ButtonShowcase name="btn-success" className="btn-success">
              Success State
            </ButtonShowcase>
            <ButtonShowcase name="btn-danger" className="btn-danger">
              Danger Action
            </ButtonShowcase>
            <ButtonShowcase name="btn-primary disabled" className="btn-primary" disabled>
              Disabled State
            </ButtonShowcase>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-white/90">Cards</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Default Card */}
            <div className="card">
              <div className="card-header">
                <span className="font-medium">Default Card</span>
                <span className="text-xs text-white/40">Header</span>
              </div>
              <div className="card-body">
                <p className="text-sm text-white/70">
                  This is the default card style used throughout the application. 
                  It has subtle borders and a slightly elevated surface.
                </p>
              </div>
              <div className="card-footer">
                <span className="text-xs text-white/40">Footer</span>
                <button className="btn btn-primary btn-sm">Action</button>
              </div>
            </div>

            {/* Selected Card */}
            <div className="card card-selected">
              <div className="card-header">
                <span className="font-medium text-indigo-400">Selected Card</span>
                <span className="text-xs text-indigo-400/60">Active</span>
              </div>
              <div className="card-body">
                <p className="text-sm text-white/70">
                  The selected state uses indigo accents to indicate this card 
                  is currently active or chosen.
                </p>
              </div>
              <div className="card-footer border-indigo-500/20">
                <span className="text-xs text-indigo-400/60">Selected</span>
                <button className="btn btn-primary btn-sm">Continue</button>
              </div>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-white/90">Form Elements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div>
              <label className="field-label mb-2 block">Input Field</label>
              <input 
                type="text" 
                className="input w-full" 
                placeholder="Type something..."
                defaultValue="Example text"
              />
            </div>
            <div>
              <label className="field-label mb-2 block">Textarea</label>
              <textarea 
                className="textarea w-full" 
                rows={3}
                placeholder="Longer text..."
                defaultValue="This is a textarea for longer content."
              />
            </div>
          </div>
        </section>

        {/* Sidebar Elements */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-white/90">Sidebar Elements</h2>
          
          <div className="bg-black/40 border border-white/10 rounded-lg p-4 max-w-xs">
            <div className="sidebar-logo mb-4">🎬 Kids Studio</div>
            <div className="space-y-1">
              <div className="sidebar-item-active">
                <span>1</span>
                <span>Active Stage</span>
              </div>
              <div className="sidebar-item-unlocked">
                <span>2</span>
                <span>Unlocked Stage</span>
              </div>
              <div className="sidebar-item-locked">
                <span>3</span>
                <span>Locked Stage</span>
              </div>
            </div>
          </div>
        </section>

        {/* Special Labels */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-white/90">Special Labels</h2>
          
          <div className="flex gap-4 flex-wrap">
            <div>
              <p className="text-xs text-white/40 mb-1">stage-label</p>
              <div className="stage-label">Stage Label</div>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">clip-label</p>
              <div className="clip-label">Begin_01</div>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">act-indicator-active</p>
              <div className="act-indicator-active">BEGINNING</div>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">act-indicator-done</p>
              <div className="act-indicator-done">MIDDLE</div>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">act-indicator-locked</p>
              <div className="act-indicator-locked">END</div>
            </div>
          </div>
        </section>

        {/* Design Principles */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-white/90">Design Principles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-medium text-lg mb-2 text-indigo-400">⚡ Energy Through Motion</h3>
              <p className="text-sm text-white/70">
                Every interaction should feel alive. Animation is feedback that makes 
                the tool feel responsive and delightful.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="font-medium text-lg mb-2 text-indigo-400">🏗️ Depth Creates Focus</h3>
              <p className="text-sm text-white/70">
                Use layered elevation to guide the eye. The most important element 
                floats highest. Think theater stage lighting.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="font-medium text-lg mb-2 text-indigo-400">🎨 Color is Signal</h3>
              <p className="text-sm text-white/70">
                Use the accent palette purposefully. Color means &quot;pay attention here&quot; 
                or &quot;this is active&quot;. Never use color just to &quot;make it pretty&quot;.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="font-medium text-lg mb-2 text-indigo-400">✨ Spaciousness is Premium</h3>
              <p className="text-sm text-white/70">
                Generous padding, relaxed line-height, breathing room between elements. 
                A cramped interface feels cheap.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-8 text-center text-sm text-white/40">
          <p>Design System v1.0 — Kids YouTube Studio</p>
          <p className="mt-1">Built with intention. Dark but warm. Minimal with a dash of color.</p>
        </footer>
      </div>
    </div>
  )
}

// Helper Components
function ColorSwatch({ name, color, textColor }: { name: string; color: string; textColor: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className="w-20 h-20 rounded-lg shadow-lg border border-white/10"
        style={{ backgroundColor: color }}
      />
      <div className="text-center">
        <p className="text-xs font-medium text-white/80">{name}</p>
        <p className="text-[10px] text-white/40 font-mono">{color}</p>
      </div>
    </div>
  )
}

function ButtonShowcase({ 
  name, 
  className, 
  children, 
  disabled 
}: { 
  name: string; 
  className: string; 
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button className={className} disabled={disabled}>
        {children}
      </button>
      <span className="text-[10px] text-white/40 font-mono">{name}</span>
    </div>
  )
}
