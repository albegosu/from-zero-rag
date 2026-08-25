<template>
  <!-- Label cell -->
  <label :for="fieldId" class="wz-label flex items-center gap-2 text-xs">
    <span>{{ field.label }}</span>
    <span v-if="field.required" class="text-[11px]" style="color: var(--term-warn)">*</span>
  </label>

  <!-- Value cell -->
  <div>
    <!-- text / password -->
    <template v-if="field.type === 'text' || field.type === 'password'">
      <div class="flex items-stretch">
        <input
          :id="fieldId"
          class="wz-input flex-1"
          :type="inputType"
          :placeholder="textPlaceholder"
          :value="value ?? ''"
          :aria-invalid="!!error"
          :aria-describedby="error ? `${fieldId}-error` : undefined"
          :aria-required="field.required"
          @input="emitValue(($event.target as HTMLInputElement).value)"
        />
        <button
          v-if="field.type === 'password'"
          type="button"
          class="ml-2 wz-btn-ghost text-xs"
          @click="reveal = !reveal"
        >
          {{ reveal ? t('wizard.chrome.hide') : t('wizard.chrome.show') }}
        </button>
        <a
          v-if="field.externalLink"
          :href="field.externalLink.url"
          target="_blank"
          rel="noopener"
          class="ml-2 wz-btn-ghost text-xs flex items-center"
        >
          ↗ {{ translateOptional(field.externalLink.text) }}
        </a>
      </div>
    </template>

    <!-- number -->
    <template v-else-if="field.type === 'number'">
      <div class="flex items-center gap-2">
        <input
          :id="fieldId"
          type="number"
          class="wz-input w-32"
          :min="field.min"
          :max="field.max"
          :step="field.step"
          :value="displayScalar"
          :aria-invalid="!!error"
          :aria-describedby="error ? `${fieldId}-error` : undefined"
          @input="emitValue(parseNumber(($event.target as HTMLInputElement).value))"
        />
        <span v-if="field.unit || field.min !== undefined" class="wz-faint text-xs">
          <template v-if="field.unit">{{ field.unit }}</template>
          <template v-if="field.min !== undefined && field.max !== undefined">
            · {{ field.min }}–{{ field.max }}
          </template>
        </span>
      </div>
    </template>

    <!-- slider -->
    <template v-else-if="field.type === 'slider'">
      <div class="flex items-center gap-3">
        <input
          :id="fieldId"
          type="range"
          class="flex-1"
          :min="field.min ?? 0"
          :max="field.max ?? 100"
          :step="field.step ?? 1"
          :value="displayScalar"
          @input="emitValue(parseNumber(($event.target as HTMLInputElement).value))"
        />
        <span class="w-24 text-right text-xs wz-strong">
          {{ displayScalar }}<span v-if="field.unit"> {{ field.unit }}</span>
        </span>
      </div>
    </template>

    <!-- select -->
    <template v-else-if="field.type === 'select'">
      <select
        :id="fieldId"
        class="wz-select"
        :value="displayScalar"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${fieldId}-error` : undefined"
        @change="emitValue(($event.target as HTMLSelectElement).value)"
      >
        <option
          v-if="useSystemHint && systemHintText && isEmptyValue"
          value=""
          disabled
        >
          {{ systemHintText }}
        </option>
        <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </template>

    <!-- checkbox -->
    <template v-else-if="field.type === 'checkbox'">
      <label class="inline-flex items-center gap-2 cursor-pointer text-sm">
        <input
          :id="fieldId"
          type="checkbox"
          :checked="!!value"
          @change="emitValue(($event.target as HTMLInputElement).checked)"
        />
        <span class="wz-muted text-xs">
          <template v-if="useSystemHint && systemHintText && isEmptyValue">
            {{ systemHintText }}
          </template>
          <template v-else>
            {{ field.helpText ? translateOptional(field.helpText) : (value ? t('wizard.chrome.enabled') : t('wizard.chrome.disabled')) }}
          </template>
        </span>
      </label>
    </template>

    <!-- textarea -->
    <template v-else-if="field.type === 'textarea'">
      <textarea
        :id="fieldId"
        class="wz-input w-full"
        :rows="field.rows ?? 4"
        :placeholder="textPlaceholder"
        :value="value ?? ''"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${fieldId}-error` : undefined"
        @input="emitValue(($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </template>

    <!-- tags -->
    <template v-else-if="field.type === 'tags'">
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="(tag, i) in (value ?? []) as string[]"
          :key="i"
          class="wz-pill flex items-center gap-1"
        >
          {{ tag }}
          <button type="button" class="hover:opacity-70" @click="removeTag(i)">×</button>
        </span>
        <input
          class="wz-input w-32 text-xs py-1"
          :placeholder="t('wizard.chrome.addTag')"
          @keydown.enter.prevent="addTag(($event.target as HTMLInputElement))"
        />
      </div>
    </template>

    <p v-if="error" :id="`${fieldId}-error`" role="alert" class="mt-1 text-xs" style="color: var(--term-danger)">{{ error }}</p>
    <p
      v-else-if="useSystemHint && systemHintText && isEmptyValue && field.type !== 'checkbox'"
      class="mt-1 wz-faint text-[11px]"
    >
      {{ systemHintText }}
    </p>
    <p v-else-if="field.helpText && field.type !== 'checkbox'" class="mt-1 wz-faint text-[11px]">
      {{ translateOptional(field.helpText) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ConfigField } from '~/utils/setup';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  field: ConfigField;
  value: any;
  error: string | null;
  /** When set, empty fields show this system value as hint instead of wizard defaults */
  systemHint?: unknown;
  useSystemHint?: boolean;
}>();

const emit = defineEmits<{
  update: [id: string, value: any];
}>();

const { t, te } = useI18n();
const reveal = ref(false);

const fieldId = computed(() => `wz-field-${props.field.id}`);

const isEmptyValue = computed(() => {
  const v = props.value
  if (v === undefined || v === null || v === '') return true
  if (Array.isArray(v) && v.length === 0) return true
  return false
})

const displayScalar = computed(() => {
  if (props.useSystemHint) {
    const empty =
      props.value === undefined ||
      props.value === null ||
      props.value === '' ||
      (Array.isArray(props.value) && props.value.length === 0)
    if (empty && props.systemHint !== undefined && props.systemHint !== null && props.systemHint !== '') {
      if (props.field.type === 'slider' || props.field.type === 'number') {
        const n = Number(props.systemHint)
        return Number.isFinite(n) ? n : props.systemHint
      }
      return props.systemHint
    }
    if (props.field.type === 'slider' || props.field.type === 'number') {
      return props.value ?? ''
    }
    return props.value ?? ''
  }
  if (props.field.type === 'slider' || props.field.type === 'number') {
    return props.value ?? props.field.defaultValue ?? ''
  }
  return props.value ?? props.field.defaultValue ?? ''
})

const systemHintText = computed(() => {
  if (!props.useSystemHint || props.systemHint === undefined || props.systemHint === null) return ''
  if (props.field.type === 'checkbox') {
    const on = props.systemHint === true || props.systemHint === 'true'
    return t('settings.systemHint', {
      value: on ? t('wizard.chrome.enabled') : t('wizard.chrome.disabled'),
    })
  }
  if (Array.isArray(props.systemHint)) {
    return t('settings.systemHint', { value: (props.systemHint as string[]).join(', ') })
  }
  return t('settings.systemHint', { value: String(props.systemHint) })
})

const textPlaceholder = computed(() => {
  if (props.useSystemHint && systemHintText.value && isEmptyValue.value) {
    return systemHintText.value
  }
  return translateOptional(props.field.placeholder)
})

const inputType = computed(() => {
  if (props.field.type === 'password') return reveal.value ? 'text' : 'password';
  return 'text';
});

function emitValue(v: any) {
  emit('update', props.field.id, v);
}

function parseNumber(raw: string): number | null {
  if (raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function addTag(input: HTMLInputElement) {
  const raw = input.value.trim();
  if (!raw) return;
  const current = (props.value ?? []) as string[];
  if (!current.includes(raw)) emitValue([...current, raw]);
  input.value = '';
}

function removeTag(index: number) {
  const current = (props.value ?? []) as string[];
  emitValue(current.filter((_, i) => i !== index));
}

function translateOptional(value?: string): string {
  if (!value) return '';
  return te(value) ? t(value) : value;
}
</script>
