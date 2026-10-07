import React from 'react';
import { AsyncStorage as LibAsyncStorage } from '@/lib/storage';

export const Spinner = ({ size, color }: any) => <div />;
export const StyleSheet = { create: (s: any) => s };
export const imgSrc = ({ uri }: { uri: string }) => uri;
export const press = (fn: any) => fn;
export const sx = (s: any) => s;
export const changeText = (fn: any) => (e: any) => fn(e?.target?.value ?? e);
export const tin = (_opts: any) => ({});
export const Dialog = ({ children, visible }: any) => (visible ? <div>{children}</div> : null);
export const Platform = { OS: 'web' };
export const Toggle = (props: any) => <input type="checkbox" {...props} />;
export const ListView = ({ data, renderItem }: any) => <div>{data?.map((d: any, i: number) => <div key={i}>{renderItem({ item: d })}</div>)}</div>;

export const AsyncStorage = LibAsyncStorage;
export default {
  Spinner,
  StyleSheet,
  imgSrc,
  press,
  sx,
  changeText,
  tin,
  Dialog,
  Platform,
  Toggle,
  ListView,
  AsyncStorage,
};
