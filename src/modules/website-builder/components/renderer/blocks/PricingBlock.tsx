import React from 'react';
import { SiteTheme } from '../../../types';
import { ComponentAction } from '../../../types/shared';
import { Plus, Trash2, Check } from 'lucide-react';
import { ActionButton } from '../ActionButton';
import {
  getBaseSectionStyle,
  getFullHeadingStyle,
  getBodyTextStyle,
  getButtonStyle,
  getCardStyle,
  getThemeShadow,
  getThemeShadowHover,
  isDarkColor,
} from '../../../utils/themeUtils';

interface Plan {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaAction?: ComponentAction;
}

type PricingVariant = 'classic' | 'gradient' | 'compact' | 'bordered';

interface PricingBlockProps {
  title: string;
  subtitle?: string;
  plans: Plan[];
  bgColor?: string;
  variant?: PricingVariant;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function PricingBlock({ title, subtitle, plans, bgColor, variant = 'classic', theme, isEditing, onUpdate, style }: PricingBlockProps) {
  const updatePlan = (index: number, field: string, value: any) => {
    const updated = plans.map((p, i) => i === index ? { ...p, [field]: value } : p);
    onUpdate?.({ plans: updated });
  };

  const updatePlanFeature = (planIdx: number, featIdx: number, value: string) => {
    const updated = plans.map((p, i) => {
      if (i !== planIdx) return p;
      const feats = p.features.map((f, j) => j === featIdx ? value : f);
      return { ...p, features: feats };
    });
    onUpdate?.({ plans: updated });
  };

  const addFeature = (planIdx: number) => {
    const updated = plans.map((p, i) => i === planIdx ? { ...p, features: [...p.features, 'New feature'] } : p);
    onUpdate?.({ plans: updated });
  };

  const removeFeature = (planIdx: number, featIdx: number) => {
    const updated = plans.map((p, i) => i === planIdx ? { ...p, features: p.features.filter((_, j) => j !== featIdx) } : p);
    onUpdate?.({ plans: updated });
  };

  const addPlan = () => {
    onUpdate?.({ plans: [...plans, { name: 'New Plan', price: '$0/mo', features: ['Feature 1'], highlighted: false }] });
  };

  const removePlan = (index: number) => {
    onUpdate?.({ plans: plans.filter((_, i) => i !== index) });
  };

  const toggleHighlight = (index: number) => {
    updatePlan(index, 'highlighted', !plans[index].highlighted);
  };

  const isDark = isDarkColor(bgColor) || isDarkColor(theme.backgroundColor);
  
  // Theme-aware styles
  const sectionStyle = { ...getBaseSectionStyle(theme, bgColor), ...style };
  const headingStyle = getFullHeadingStyle(theme, 30, isDark ? '#f1f5f9' : theme.textColor);
  const subtitleStyle = getBodyTextStyle(theme, 16, isDark ? '#94a3b8' : theme.secondaryColor, { opacity: 0.7 });
  const buttonStyles = getButtonStyle('primary', theme);
  const cardShadow = getThemeShadow(theme);
  const cardHoverShadow = getThemeShadowHover(theme);

  // Shared header
  const header = (
    <div className="text-center mb-12">
      {isEditing ? (
        <h2
          contentEditable suppressContentEditableWarning
          onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
          className="font-bold mb-3 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
          style={headingStyle}
        >{title}</h2>
      ) : (
        <h2 className="font-bold mb-3" style={headingStyle}>{title}</h2>
      )}
      {(subtitle || isEditing) && (
        isEditing ? (
          <p contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ subtitle: e.currentTarget.textContent || '' })}
            className="outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 max-w-2xl mx-auto"
            style={subtitleStyle}
          >{subtitle || 'Add subtitle...'}</p>
        ) : subtitle ? (
          <p className="max-w-2xl mx-auto" style={subtitleStyle}>{subtitle}</p>
        ) : null
      )}
    </div>
  );

  // Editor controls for each plan
  const renderEditorControls = (i: number, plan: Plan) => isEditing ? (
    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/plan:opacity-100 transition-opacity z-10">
      <button onClick={() => toggleHighlight(i)} className="p-1 rounded-md bg-primary/10 text-primary text-[10px] hover:bg-primary/20">
        {plan.highlighted ? '★' : '☆'}
      </button>
      <button onClick={() => removePlan(i)} className="p-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  ) : null;

  // Plan name editor
  const renderPlanName = (plan: Plan, i: number, textColor: string) => {
    const nameStyle = getFullHeadingStyle(theme, 18, textColor);
    return isEditing ? (
      <h3 contentEditable suppressContentEditableWarning
        onBlur={(e) => updatePlan(i, 'name', e.currentTarget.textContent || '')}
        className="font-semibold mb-2 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
        style={nameStyle}
      >{plan.name}</h3>
    ) : (
      <h3 className="font-semibold mb-2" style={nameStyle}>{plan.name}</h3>
    );
  };

  // Plan price editor
  const renderPlanPrice = (plan: Plan, i: number, priceColor: string) => {
    const priceStyle = getFullHeadingStyle(theme, 36, priceColor);
    return isEditing ? (
      <p contentEditable suppressContentEditableWarning
        onBlur={(e) => updatePlan(i, 'price', e.currentTarget.textContent || '')}
        className="font-bold mb-6 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
        style={priceStyle}
      >{plan.price}</p>
    ) : (
      <p className="font-bold mb-6" style={priceStyle}>{plan.price}</p>
    );
  };

  // Features list
  const renderFeatures = (plan: Plan, planIdx: number, textColor: string) => {
    const featureStyle = getBodyTextStyle(theme, 14, textColor, { opacity: 0.8 });
    return (
      <ul className="space-y-3 mb-8">
        {plan.features.map((f, j) => (
          <li key={j} className="flex items-center justify-center gap-2 group/feat" style={featureStyle}>
            <Check className="h-3.5 w-3.5 shrink-0" style={{ color: theme.primaryColor }} />
            {isEditing ? (
              <>
                <span contentEditable suppressContentEditableWarning
                  onBlur={(e) => updatePlanFeature(planIdx, j, e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
                >{f}</span>
                <button onClick={() => removeFeature(planIdx, j)} className="p-0.5 text-destructive opacity-0 group-hover/feat:opacity-100 transition-opacity">
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </>
            ) : (
              <span>{f}</span>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const addPlanButton = isEditing ? (
    <div className="text-center mt-6">
      <button onClick={addPlan} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
        <Plus className="h-3 w-3" /> Add Plan
      </button>
    </div>
  ) : null;

  // ═══ GRADIENT VARIANT ═══
  if (variant === 'gradient') {
    return (
      <section style={sectionStyle}>
        <div className="max-w-5xl mx-auto">
          {header}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, i) => {
              const isHighlighted = plan.highlighted;
              return (
                <div key={i} className={`rounded-2xl overflow-hidden relative group/plan transition-shadow ${isHighlighted ? 'md:scale-105' : ''}`}
                  style={{ 
                    ...getCardStyle(theme),
                    boxShadow: isHighlighted ? cardHoverShadow : cardShadow,
                  }}>
                  {renderEditorControls(i, plan)}
                  {/* Gradient header */}
                  <div className="p-6 text-center text-white"
                    style={{ background: isHighlighted
                      ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`
                      : `linear-gradient(135deg, ${theme.primaryColor}90, ${theme.primaryColor}60)` }}>
                    {renderPlanName(plan, i, '#ffffff')}
                    {renderPlanPrice(plan, i, '#ffffff')}
                    {isHighlighted && <span className="inline-block px-3 py-0.5 bg-white/20 rounded-full text-[10px] font-semibold -mt-3 mb-2">Most Popular</span>}
                  </div>
                  <div className="p-6 bg-card text-center">
                    {renderFeatures(plan, i, theme.textColor)}
                    {isEditing && <button onClick={() => addFeature(i)} className="text-[10px] text-primary hover:underline mb-4 block mx-auto">+ Add Feature</button>}
                    <ActionButton
                      action={plan.ctaAction}
                      href={plan.ctaLink}
                      theme={theme}
                      className="w-full py-2.5 font-medium text-white transition-transform hover:scale-105"
                      style={buttonStyles}
                      onClick={isEditing ? (e) => e.preventDefault() : undefined}
                    >
                      {plan.ctaText || 'Choose Plan'}
                    </ActionButton>
                  </div>
                </div>
              );
            })}
          </div>
          {addPlanButton}
        </div>
      </section>
    );
  }

  // ═══ COMPACT VARIANT ═══
  if (variant === 'compact') {
    return (
      <section style={sectionStyle}>
        <div className="max-w-3xl mx-auto">
          {header}
          <div className="space-y-4">
            {plans.map((plan, i) => (
              <div key={i} className={`flex flex-col md:flex-row items-center gap-6 p-6 rounded-xl relative group/plan transition-shadow ${plan.highlighted ? 'border-2' : 'border'}`}
                style={{ 
                  borderColor: plan.highlighted ? theme.primaryColor : '#e2e8f0', 
                  ...getCardStyle(theme),
                  backgroundColor: plan.highlighted ? theme.primaryColor + '05' : 'transparent',
                  boxShadow: plan.highlighted ? cardShadow : 'none',
                }}>
                {renderEditorControls(i, plan)}
                <div className="md:w-1/4 text-center md:text-left">
                  {renderPlanName(plan, i, isDark ? '#f1f5f9' : theme.textColor)}
                  {renderPlanPrice(plan, i, theme.primaryColor)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2">
                    {plan.features.map((f, j) => (
                      <span key={j} className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-muted/50 group/feat" style={{ color: isDark ? '#cbd5e1' : theme.textColor }}>
                        <Check className="h-3 w-3" style={{ color: theme.primaryColor }} />
                        {isEditing ? (
                          <>
                            <span contentEditable suppressContentEditableWarning onBlur={(e) => updatePlanFeature(i, j, e.currentTarget.textContent || '')}
                              className="outline-none">{f}</span>
                            <button onClick={() => removeFeature(i, j)} className="text-destructive opacity-0 group-hover/feat:opacity-100"><Trash2 className="h-2 w-2" /></button>
                          </>
                        ) : f}
                      </span>
                    ))}
                    {isEditing && <button onClick={() => addFeature(i)} className="text-[10px] text-primary hover:underline">+ Add</button>}
                  </div>
                </div>
                <ActionButton
                  action={plan.ctaAction}
                  href={plan.ctaLink}
                  theme={theme}
                  className="px-6 py-2.5 font-medium text-white shrink-0 transition-transform hover:scale-105"
                  style={buttonStyles}
                  onClick={isEditing ? (e) => e.preventDefault() : undefined}
                >
                  {plan.ctaText || 'Choose'}
                </ActionButton>
              </div>
            ))}
          </div>
          {addPlanButton}
        </div>
      </section>
    );
  }

  // ═══ BORDERED VARIANT ═══
  if (variant === 'bordered') {
    return (
      <section style={sectionStyle}>
        <div className="max-w-5xl mx-auto">
          {header}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border rounded-2xl overflow-hidden" style={{ borderRadius: theme.borderRadius }}>
            {plans.map((plan, i) => (
              <div key={i} className={`p-6 sm:p-8 text-center relative group/plan ${i < plans.length - 1 ? 'border-b md:border-b-0 md:border-r' : ''} ${plan.highlighted ? 'bg-primary/5' : ''}`}>
                {renderEditorControls(i, plan)}
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: theme.primaryColor }} />
                )}
                {renderPlanName(plan, i, isDark ? '#f1f5f9' : theme.textColor)}
                {renderPlanPrice(plan, i, theme.primaryColor)}
                {renderFeatures(plan, i, isDark ? '#cbd5e1' : theme.textColor)}
                {isEditing && <button onClick={() => addFeature(i)} className="text-[10px] text-primary hover:underline mb-4 block mx-auto">+ Add Feature</button>}
                <ActionButton
                  action={plan.ctaAction}
                  href={plan.ctaLink}
                  theme={theme}
                  className={`w-full py-2.5 font-medium transition-transform hover:scale-105 ${plan.highlighted ? 'text-white' : 'border-2'}`}
                  style={plan.highlighted ? buttonStyles : getButtonStyle('outline', theme)}
                  onClick={isEditing ? (e) => e.preventDefault() : undefined}
                >
                  {plan.ctaText || 'Choose Plan'}
                </ActionButton>
              </div>
            ))}
          </div>
          {addPlanButton}
        </div>
      </section>
    );
  }

  // ═══ DEFAULT CLASSIC VARIANT ═══
  return (
    <section style={sectionStyle}>
      <div className="max-w-5xl mx-auto">
        {header}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div key={i}
              className={`p-6 sm:p-8 border-2 text-center relative group/plan transition-all ${plan.highlighted ? 'md:scale-105' : ''}`}
              style={{
                borderColor: plan.highlighted ? theme.primaryColor : isDark ? '#334155' : '#e2e8f0',
                backgroundColor: plan.highlighted ? theme.primaryColor + '08' : 'transparent',
                ...getCardStyle(theme),
                boxShadow: plan.highlighted ? cardHoverShadow : cardShadow,
              }}>
              {renderEditorControls(i, plan)}
              {renderPlanName(plan, i, isDark ? '#f1f5f9' : theme.textColor)}
              {renderPlanPrice(plan, i, theme.primaryColor)}
              {renderFeatures(plan, i, isDark ? '#cbd5e1' : theme.textColor)}
              {isEditing && <button onClick={() => addFeature(i)} className="text-[10px] text-primary hover:underline mb-4 block mx-auto">+ Add Feature</button>}
              <ActionButton
                action={plan.ctaAction}
                href={plan.ctaLink}
                theme={theme}
                className="w-full py-2.5 font-medium text-white transition-transform hover:scale-105"
                style={buttonStyles}
                onClick={isEditing ? (e) => e.preventDefault() : undefined}
              >
                {plan.ctaText || 'Choose Plan'}
              </ActionButton>
            </div>
          ))}
        </div>
        {addPlanButton}
      </div>
    </section>
  );
}
