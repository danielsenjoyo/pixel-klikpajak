<script setup lang="ts">
import { MpSelect } from '@mekari/pixel3'

// Prototype version picker in the header (data/versions.ts). Not part of the product — it lets
// a reviewer flip between the running release and the next one.
const { version, versions, setVersion } = usePrototypeVersion()
const current = computed(() => versions.find(v => v.id === version.value)!)
</script>

<template>
  <span v-tooltip="{ label: current.description, placement: 'bottom' }" class="kp-version">
    <MpSelect
      id="kp-version"
      :model-value="version"
      size="sm"
      aria-label="Versi prototipe"
      @update:model-value="setVersion(String($event))"
    >
      <option v-for="v in versions" :key="v.id" :value="v.id">Versi {{ v.label }}</option>
    </MpSelect>
  </span>
</template>

<style scoped>
.kp-version {
  display: inline-flex;
  width: 136px;
}
</style>
