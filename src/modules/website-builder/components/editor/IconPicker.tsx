/**
 * IconPicker — searchable grid of Lucide icons + social media SVG icons.
 * Returns the icon name as a string (e.g. "Heart", "facebook", "twitter").
 */
import React, { useState, useMemo } from 'react';
import { icons as lucideIcons } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X } from 'lucide-react';

// ── Social Media SVG icons ──
const SOCIAL_ICONS: Record<string, React.FC<{ className?: string }>> = {
  facebook: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  ),
  twitter: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  ),
  instagram: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  ),
  linkedin: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  ),
  youtube: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  ),
  google: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
  ),
  'google-business': ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M22 9.74l-2-4.37A2 2 0 0018.18 4H5.82A2 2 0 004 5.37l-2 4.37A3.13 3.13 0 004.46 14 3.24 3.24 0 006 14.46 3.24 3.24 0 008.46 13a3.34 3.34 0 003.08 1.46A3.34 3.34 0 0014.62 13 3.24 3.24 0 0018 14.46a3.24 3.24 0 001.54-.46A3.13 3.13 0 0022 9.74zM4 15.46V19a2 2 0 002 2h12a2 2 0 002-2v-3.54a4.06 4.06 0 01-1.5.31 4.22 4.22 0 01-2.5-.82 4.22 4.22 0 01-4 0 4.22 4.22 0 01-4 0 4.22 4.22 0 01-2.5.82A4.06 4.06 0 014 15.46z"/></svg>
  ),
  'google-maps': ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
  ),
  'google-play': ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302-2.302 2.302L15.396 12l2.302-2.492zM5.864 2.658L16.8 8.991 14.5 11.293 5.864 2.658z"/></svg>
  ),
  'app-store': ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
  ),
  github: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
  ),
  tiktok: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
  ),
  discord: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/></svg>
  ),
  pinterest: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/></svg>
  ),
  whatsapp: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  ),
  telegram: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0 12 12 0 0011.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
  ),
  snapchat: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12.017.064c-3.272 0-5.436 1.947-5.975 4.645-.038.188-.074.494-.074.853 0 .609.1 1.238.1 1.238s-.045.283-.322.452c-.274.169-.688.2-.913.207-.346.01-.733-.03-.898-.044-.288-.025-.542.066-.683.19a.71.71 0 00-.223.49c-.01.293.17.578.558.763a4.87 4.87 0 00.755.292c.168.049.62.165.807.272.36.206.36.504.36.504-.098.504-.602.947-1.018 1.295a5.14 5.14 0 01-.627.47c-.386.239-.742.491-.742.985 0 .346.244.713.7 1.024.596.406 1.482.678 2.63.808.123.014.221.128.244.272.03.19-.078.37-.078.37s.038.119.128.283c.225.41.662.826 1.44 1.176C9.56 22.068 10.788 24 12.017 24s2.458-1.932 3.862-2.916c.778-.35 1.215-.766 1.44-1.176.09-.164.128-.283.128-.283s-.109-.18-.078-.37c.023-.144.12-.258.244-.272 1.148-.13 2.034-.402 2.63-.808.456-.311.7-.678.7-1.024 0-.494-.356-.746-.742-.985a5.14 5.14 0 01-.627-.47c-.416-.348-.92-.791-1.018-1.295 0 0 0-.298.36-.504.187-.107.639-.223.807-.272a4.87 4.87 0 00.755-.292c.388-.185.568-.47.558-.763a.71.71 0 00-.223-.49c-.141-.124-.395-.215-.683-.19-.165.014-.552.054-.898.044-.225-.007-.639-.038-.913-.207-.277-.169-.322-.452-.322-.452s.1-.629.1-1.238c0-.359-.036-.665-.074-.853C17.453 2.011 15.289.064 12.017.064z"/></svg>
  ),
  reddit: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 00.029-.463.33.33 0 00-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 00-.232-.095z"/></svg>
  ),
  spotify: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
  ),
  dribbble: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.81zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.29zm10.335 3.483c-.218.29-1.89 2.478-5.664 4.023.24.49.47.985.68 1.485.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.37-6.37z"/></svg>
  ),
  behance: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M6.938 4.503c.702 0 1.34.06 1.92.188.577.13 1.07.33 1.485.61.41.28.733.65.96 1.12.225.47.338 1.05.338 1.75 0 .74-.17 1.36-.507 1.86-.338.5-.837.9-1.502 1.22.906.26 1.576.72 2.022 1.37.448.66.665 1.45.665 2.36 0 .75-.13 1.39-.41 1.93-.28.55-.67 1-1.16 1.35-.48.348-1.05.6-1.67.767-.63.16-1.3.24-2.004.24H0V4.51h6.938v-.007zM6.545 10.16c.6 0 1.09-.16 1.47-.472.38-.316.57-.77.57-1.36 0-.33-.06-.6-.18-.82a1.4 1.4 0 00-.5-.54 2.1 2.1 0 00-.74-.3 4.06 4.06 0 00-.91-.1H3.487v3.59h3.06zm.195 5.83c.34 0 .66-.04.96-.12.3-.08.56-.2.79-.37.22-.16.4-.38.53-.65.13-.27.19-.6.19-1 0-.78-.23-1.35-.66-1.69-.44-.34-1.01-.51-1.7-.51H3.487v4.34h3.253zM21.762 18.085c-.62.53-1.54.8-2.77.8-.74 0-1.42-.12-2.03-.36a4.4 4.4 0 01-1.54-1.02 4.4 4.4 0 01-.98-1.59c-.23-.61-.34-1.29-.34-2.03 0-.77.12-1.46.37-2.08.24-.62.58-1.15 1.02-1.59.43-.44.95-.78 1.55-1.02.6-.24 1.27-.36 2-.36.86 0 1.58.16 2.17.49.59.33 1.07.78 1.45 1.35.38.57.65 1.22.82 1.95.17.73.22 1.5.15 2.3h-7.18c.05.78.35 1.4.92 1.84.56.44 1.24.66 2.03.66.59 0 1.1-.15 1.52-.44.42-.3.73-.64.93-1.01h2.62c-.41 1.28-1.1 2.22-2.08 2.8zm-1.7-7.7c-.48-.43-1.12-.65-1.93-.65-.53 0-.98.09-1.35.27-.37.18-.67.4-.9.66-.23.26-.4.55-.5.86-.1.31-.17.6-.2.87h5.57c-.1-.82-.41-1.58-.7-2.01zM15.5 4h5v1.5h-5V4z"/></svg>
  ),
};

export const SOCIAL_ICON_NAMES = Object.keys(SOCIAL_ICONS);

// Curated popular Lucide icon names for quick access
const POPULAR_ICONS = [
  'Home', 'Heart', 'Star', 'Settings', 'User', 'Mail', 'Phone', 'MapPin',
  'Calendar', 'Clock', 'Search', 'ShoppingCart', 'ShoppingBag', 'CreditCard',
  'Globe', 'Link', 'ExternalLink', 'Download', 'Upload', 'Image', 'Camera',
  'Video', 'Music', 'Headphones', 'Mic', 'Play', 'Pause',
  'ChevronRight', 'ChevronDown', 'ArrowRight', 'ArrowUp',
  'Check', 'CheckCircle', 'X', 'XCircle', 'AlertCircle', 'Info',
  'Bell', 'MessageSquare', 'MessageCircle', 'Send',
  'Lock', 'Unlock', 'Shield', 'Key', 'Eye', 'EyeOff',
  'Bookmark', 'Tag', 'Flag', 'Award', 'Trophy', 'Zap', 'Sparkles',
  'Sun', 'Moon', 'Cloud', 'Droplets', 'Flame',
  'FileText', 'Folder', 'Clipboard', 'Edit', 'Trash2', 'Copy',
  'Code', 'Terminal', 'Database', 'Server', 'Wifi', 'Bluetooth',
  'Smartphone', 'Monitor', 'Tablet', 'Printer', 'Cpu',
  'Users', 'UserPlus', 'UserCheck', 'Building', 'Briefcase',
  'BarChart3', 'PieChart', 'TrendingUp', 'Activity', 'Target',
  'Rocket', 'Lightbulb', 'Puzzle', 'Layers', 'Grid', 'LayoutGrid',
  'Package', 'Truck', 'Car',
];

interface IconPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showSocial?: boolean;
}

export function IconPicker({ label, value, onChange, showSocial = false }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'popular' | 'all' | 'social'>('popular');

  // Get all lucide icon names
  const allIconNames = useMemo(() => Object.keys(lucideIcons).filter(
    name => name !== 'createLucideIcon' && name !== 'icons' && name !== 'default' && typeof (lucideIcons as any)[name] === 'object'
  ), []);

  const filteredIcons = useMemo(() => {
    const source = tab === 'popular' ? POPULAR_ICONS : tab === 'social' ? [] : allIconNames;
    if (!search) return source;
    const q = search.toLowerCase();
    return source.filter(name => name.toLowerCase().includes(q));
  }, [tab, search, allIconNames]);

  const filteredSocial = useMemo(() => {
    if (tab !== 'social') return [];
    if (!search) return SOCIAL_ICON_NAMES;
    const q = search.toLowerCase();
    return SOCIAL_ICON_NAMES.filter(name => name.toLowerCase().includes(q));
  }, [tab, search]);

  const renderLucideIcon = (name: string) => {
    const Icon = (lucideIcons as any)[name];
    if (!Icon || typeof Icon !== 'object') return null;
    try {
      return <Icon className="h-4 w-4" />;
    } catch {
      return null;
    }
  };

  const renderSocialIcon = (name: string) => {
    const Icon = SOCIAL_ICONS[name];
    if (!Icon) return null;
    return <Icon className="h-4 w-4" />;
  };

  // Render current value preview
  const renderPreview = () => {
    if (!value) return <span className="text-muted-foreground/40 text-xs">None</span>;
    if (SOCIAL_ICONS[value.toLowerCase()]) {
      const SIcon = SOCIAL_ICONS[value.toLowerCase()];
      return <SIcon className="h-4 w-4" />;
    }
    const LIcon = (lucideIcons as any)[value];
    if (LIcon && typeof LIcon === 'object') {
      try { return <LIcon className="h-4 w-4" />; } catch { /* */ }
    }
    // Fallback: show as emoji/text
    return <span className="text-sm">{value}</span>;
  };

  if (!open) {
    return (
      <div className="space-y-1.5">
        <Label className="text-[11px] font-medium text-foreground/70">{label}</Label>
        <button
          onClick={() => setOpen(true)}
          className="w-full h-9 flex items-center gap-2 px-2.5 rounded-lg border border-border/40 bg-background hover:bg-muted/30 transition-colors text-left"
        >
          <div className="w-6 h-6 rounded-md bg-muted/40 flex items-center justify-center shrink-0">
            {renderPreview()}
          </div>
          <span className="text-xs text-foreground/70 flex-1 truncate">{value || 'Choose icon...'}</span>
          {value && (
            <button
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="p-0.5 text-muted-foreground/40 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-medium text-foreground/70">{label}</Label>
        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground" onClick={() => setOpen(false)}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
        <Input
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 text-xs pl-7 border-border/40 bg-background"
          autoFocus
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 p-0.5 bg-muted/30 rounded-md">
        {(['popular', 'all', ...(showSocial ? ['social'] : [])] as const).map(t => (
          <button
            key={t}
            className={`flex-1 text-[10px] font-medium py-1 rounded transition-colors ${
              tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab(t as any)}
          >
            {t === 'popular' ? 'Popular' : t === 'all' ? 'All' : 'Social'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <ScrollArea className="h-[200px]">
        <div className="grid grid-cols-6 gap-0.5 p-0.5">
          {tab === 'social' ? (
            filteredSocial.map(name => (
              <button
                key={name}
                onClick={() => { onChange(name); setOpen(false); }}
                className={`aspect-square flex items-center justify-center rounded-md transition-colors ${
                  value === name ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'hover:bg-muted/50 text-foreground/60'
                }`}
                title={name}
              >
                {renderSocialIcon(name)}
              </button>
            ))
          ) : (
            filteredIcons.map(name => (
              <button
                key={name}
                onClick={() => { onChange(name); setOpen(false); }}
                className={`aspect-square flex items-center justify-center rounded-md transition-colors ${
                  value === name ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'hover:bg-muted/50 text-foreground/60'
                }`}
                title={name}
              >
                {renderLucideIcon(name)}
              </button>
            ))
          )}
          {filteredIcons.length === 0 && filteredSocial.length === 0 && (
            <div className="col-span-6 py-6 text-center">
              <p className="text-[10px] text-muted-foreground/50">No icons match "{search}"</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * Renders a Lucide or Social icon by name string.
 * Falls back to text/emoji if icon not found.
 */
export function DynamicIcon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  if (!name) return null;

  // Check social icons first
  const SocialComp = SOCIAL_ICONS[name.toLowerCase()];
  if (SocialComp) return <SocialComp className={className} />;

  // Check lucide icons
  const LucideComp = (lucideIcons as any)[name];
  if (LucideComp && typeof LucideComp === 'object') {
    try { return <LucideComp className={className} />; } catch { /* */ }
  }

  // Fallback: render as text (emoji or character)
  return <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{name}</span>;
}
