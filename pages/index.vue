<template>
  <WelcomeModal />
  <div
    class="max-w-5xl mx-auto px-4 pt-4 lg:pt-6 flex flex-col h-[calc(100dvh-3rem-6rem)] max-h-[calc(100dvh-3rem-6rem)] overflow-hidden min-h-0"
  >
    <section class="wz-panel mb-4 lg:mb-5 shrink-0">
      <div class="wz-panel-header flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="wz-accent">$</span>
          <span class="wz-label">chat --mode={{ selectedSearchMode }} --stream</span>
        </div>
        <span class="wz-faint text-[10px]">{{ store.documents.length }} docs · ctx</span>
      </div>
      <div class="p-4">
        <h1 class="text-lg font-semibold wz-strong">// {{ t('chat.title') }}</h1>
        <p class="wz-muted text-xs mt-1">{{ t('chat.subtitle') }}</p>
      </div>
    </section>

    <div class="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-6">
      <div class="flex-[3] min-w-0 min-h-0 flex flex-col lg:flex-1 basis-0">
        <ChatHyparChatThread
          ref="threadRef"
          :messages="displayMessages"
          :expanded-set="expandedSet"
          :search-params="searchParams"
          :is-waiting="isWaiting"
          :is-searching="isSearching"
          :is-loading="conversationLoading"
          :empty-suggestions="emptySuggestions"
          :visible-error="!!visibleChatError"
          :error-message="chatErrorMessage"
          :is-app-rate-limit="isAppRateLimitError"
          :is-provider-quota="isProviderQuotaError"
          @toggle-expand="toggleExpand"
          @dismiss-error="dismissError"
          @suggestion-select="onSuggestionSelect"
        />

        <ChatHyparChatInput
          ref="inputRef"
          v-model="input"
          :is-busy="isBusy"
          :show-command-help="showCommandHelp"
          :filtered-commands="filteredCommands"
          :selected-command-idx="selectedCommandIdx"
          :has-messages="!!displayMessages.length"
          @send="send"
          @stop="chat.stop()"
          @clear="clearChat"
          @select-command="selectCommand"
          @keydown="onChatInputKeydown"
        >
          <template #controls>
            <ChatHyparChatControls
              v-model:search-mode="selectedSearchMode"
              v-model:model="selectedModel"
              :llm-provider="llmConfig?.provider"
              :model-options="llmModelOptions"
              :show-model-selector="!!(llmConfig && llmConfig.models.length > 1)"
            />
          </template>
        </ChatHyparChatInput>
      </div>

      <ChatHyparChatSidebar
        :threads="conversationThreads"
        :active-id="conversationId"
        :documents="store.documents"
        :documents-loading="store.loading"
        @select-conversation="loadConversation"
        @new-conversation="newConversation"
        @delete-conversation="deleteConversation"
        @open-document="(id: string) => navigateTo(`/documents/${id}`)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  t,
  store,
  chat,
  input,
  scrollRef,
  expandedSet,
  conversationLoading,
  conversationId,
  conversationThreads,
  llmConfig,
  selectedModel,
  selectedSearchMode,
  llmModelOptions,
  searchParams,
  displayMessages,
  emptySuggestions,
  isBusy,
  isWaiting,
  isSearching,
  visibleChatError,
  chatErrorMessage,
  isAppRateLimitError,
  isProviderQuotaError,
  showCommandHelp,
  filteredCommands,
  selectedCommandIdx,
  send,
  clearChat,
  dismissError,
  toggleExpand,
  selectCommand,
  onSuggestionSelect,
  loadConversation,
  newConversation,
  deleteConversation,
  initChatPage,
  scrollToBottom,
} = useHyparChat()

const threadRef = ref<{ scrollRef: HTMLElement | null } | null>(null)
const inputRef = ref<{ focus: () => void } | null>(null)

watchEffect(() => {
  const el = threadRef.value?.scrollRef
  if (el) scrollRef.value = el
})

function onChatInputKeydown(e: KeyboardEvent) {
  if (isBusy.value) {
    const k = e.key
    if (k.length === 1 || k === 'Enter' || k === 'Backspace' || k === 'Delete') {
      e.preventDefault()
    }
    return
  }
  if (showCommandHelp.value && filteredCommands.value.length) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedCommandIdx.value = (selectedCommandIdx.value + 1) % filteredCommands.value.length
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedCommandIdx.value = selectedCommandIdx.value <= 0
        ? filteredCommands.value.length - 1
        : selectedCommandIdx.value - 1
    } else if (e.key === 'Enter' && selectedCommandIdx.value >= 0) {
      e.preventDefault()
      selectCommand(filteredCommands.value[selectedCommandIdx.value])
    } else if (e.key === 'Escape') {
      input.value = ''
    }
  }
}

watch(
  () => isBusy.value,
  (busy, wasBusy) => {
    if (wasBusy === true && busy === false) {
      nextTick(() => inputRef.value?.focus())
    }
  },
)

onMounted(() => {
  initChatPage()
})

watch(
  () => displayMessages.value.length,
  () => scrollToBottom(),
)
</script>
